const CACHE_NAME = 'devinsfarm-static-v2'
const SYNC_QUEUE_NAME = 'sync-queue'

// Pre-cache essential files - these will be cached during install
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
]

// Runtime cache configuration
const RUNTIME_CACHE_NAME = 'devinsfarm-runtime-v2'

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
  evt.waitUntil((async () => {
    // Delete old caches
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE_NAME)
        .map(k => caches.delete(k))
    )
    // Take control immediately
    await self.clients.claim()
  })())
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
      // Try cache first for all requests
      const cachedResponse = await caches.match(evt.request)
      if (cachedResponse) {
        return cachedResponse
      }

      // Try network
      const networkResponse = await fetch(evt.request)
      
      // Cache successful responses from same origin
      if (networkResponse && networkResponse.ok && evt.request.url.startsWith(self.location.origin)) {
        const contentType = networkResponse.headers.get('content-type') || ''
        
        // Cache HTML, JS, CSS, images, fonts
        if (
          contentType.includes('text/html') ||
          contentType.includes('javascript') ||
          contentType.includes('css') ||
          contentType.includes('image') ||
          contentType.includes('font') ||
          evt.request.url.includes('/assets/')
        ) {
          const cache = await caches.open(RUNTIME_CACHE_NAME)
          cache.put(evt.request, networkResponse.clone()).catch(err => {
            console.warn('Cache put failed:', err)
          })
        }
      }
      
      return networkResponse
    } catch (err) {
      // Network failed - try to serve from cache
      console.log('Network failed, checking cache for:', evt.request.url)
      
      const cachedResponse = await caches.match(evt.request)
      if (cachedResponse) {
        return cachedResponse
      }

      // For navigation requests, return cached index.html
      if (evt.request.mode === 'navigate' || evt.request.headers.get('accept')?.includes('text/html')) {
        const indexCache = await caches.match('/index.html')
        if (indexCache) {
          return indexCache
        }
      }

      // Last resort: return offline page or error
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Network unavailable and resource not cached',
          url: evt.request.url 
        }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  })())
})
