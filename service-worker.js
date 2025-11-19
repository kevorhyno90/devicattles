const CACHE_NAME = 'devinsfarm-static-v1'
const SYNC_QUEUE_NAME = 'sync-queue'

// Keep the pre-cache list minimal (avoid referencing source files that don't exist in production)
const ASSETS = [
  '/',
  '/index.html'
]

// IndexedDB helper for storing sync queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('devinsfarm-sync', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
        db.createObjectStore(SYNC_QUEUE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function addToSyncQueue(action, data) {
  try {
    const db = await openDB()
    const tx = db.transaction([SYNC_QUEUE_NAME], 'readwrite')
    const store = tx.objectStore(SYNC_QUEUE_NAME)
    store.add({
      action,
      data,
      timestamp: Date.now()
    })
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('Failed to add to sync queue:', err)
  }
}

async function getSyncQueue() {
  try {
    const db = await openDB()
    const tx = db.transaction([SYNC_QUEUE_NAME], 'readonly')
    const store = tx.objectStore(SYNC_QUEUE_NAME)
    const request = store.getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('Failed to get sync queue:', err)
    return []
  }
}

async function clearSyncQueue() {
  try {
    const db = await openDB()
    const tx = db.transaction([SYNC_QUEUE_NAME], 'readwrite')
    const store = tx.objectStore(SYNC_QUEUE_NAME)
    store.clear()
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('Failed to clear sync queue:', err)
  }
}

self.addEventListener('install', evt => {
  // Attempt to cache listed assets but never allow an error to cause the install to fail.
  evt.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      for (const asset of ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-store' })
          if (res && res.ok) await cache.put(asset, res.clone())
        } catch (err) {
          // Log and continue. don't rethrow.
          console.warn('Asset cache failed for', asset, err)
        }
      }
    } catch (err) {
      // Very defensive: any unexpected error should be logged but not fail install.
      console.error('Service worker install error (ignored):', err)
    }
  })())
  // Activate the new SW as soon as it's finished installing
  try { self.skipWaiting() } catch (e) { /* ignore */ }
})

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  )
  self.clients.claim()
})

// Background Sync API for offline-first sync
self.addEventListener('sync', evt => {
  if (evt.tag === 'sync-data') {
    evt.waitUntil((async () => {
      try {
        const queue = await getSyncQueue()
        if (queue.length === 0) return

        // Notify all clients that sync is starting
        const clients = await self.clients.matchAll()
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_START',
            count: queue.length
          })
        })

        // Process sync queue (in real app, this would POST to server)
        // For now, we just clear the queue since we're using localStorage
        await clearSyncQueue()

        // Notify all clients that sync completed
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            count: queue.length
          })
        })

        console.log(`Synced ${queue.length} items`)
      } catch (err) {
        console.error('Sync failed:', err)
        
        // Notify clients of failure
        const clients = await self.clients.matchAll()
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_ERROR',
            error: err.message
          })
        })
      }
    })())
  }
})

// Message handler for adding items to sync queue
self.addEventListener('message', evt => {
  if (evt.data && evt.data.type === 'QUEUE_SYNC') {
    addToSyncQueue(evt.data.action, evt.data.data).then(() => {
      // Try to trigger sync immediately if online
      if (self.registration.sync) {
        self.registration.sync.register('sync-data').catch(err => {
          console.warn('Sync registration failed:', err)
        })
      }
    })
  }
})

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return
  evt.respondWith((async () => {
    try {
      const cached = await caches.match(evt.request)
      if (cached) return cached
      const fres = await fetch(evt.request)
      // If the fetch returned HTML but the request is not a navigation/HTML accept, treat as an error
      const contentType = fres.headers.get('content-type') || ''
      const isHtmlResp = contentType.includes('text/html')
      const wantsHtml = evt.request.mode === 'navigate' || ((evt.request.headers.get('accept') || '').includes('text/html'))
      if (isHtmlResp && !wantsHtml) {
        // Avoid returning index.html for assets (JS/CSS) which causes corrupted-content errors
        throw new Error('Unexpected HTML response for non-navigation request')
      }
      // Only cache same-origin resources; ignore caching failures
      try {
        if (evt.request.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(evt.request, fres.clone())
        }
      } catch (e) {
        console.warn('Runtime cache put failed', e)
      }
      return fres
    } catch (err) {
      // Network or other failure: for navigation/HTML requests serve cached index.html if available
      const wantsHtml = evt.request.mode === 'navigate' || ((evt.request.headers.get('accept') || '').includes('text/html'))
      if (wantsHtml) {
        const fallback = await caches.match('/index.html')
        if (fallback) return fallback
      }
      // For non-navigation requests (scripts/styles/etc.) return a 503 instead of HTML to avoid corrupted-content errors
      return new Response('', { status: 503, statusText: 'Service Unavailable' })
    }
  })())
})
