// Enhanced Service Worker with better offline support
// Uses Stale-While-Revalidate strategy for better offline UX

const CACHE_NAME = 'devinsfarm-cache-v' + Date.now()
const RUNTIME_CACHE = 'devinsfarm-runtime-v1'
const IMAGE_CACHE = 'devinsfarm-images-v1'

// Assets to pre-cache on install
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

// Cache file patterns
const CACHE_PATTERNS = {
  // HTML - network first, then cache
  html: /\.html$/,
  // CSS/JS - cache first with network fallback
  assets: /\.(js|css|svg|woff2?|ttf|eot)$/,
  // Images - cache first, update in background
  images: /\.(png|jpg|jpeg|gif|webp|ico)$/
}

self.addEventListener('install', evt => {
  evt.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      for (const asset of ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-store' })
          if (res?.ok) await cache.put(asset, res.clone())
        } catch (err) {
          console.warn('Asset cache failed for', asset, err)
        }
      }
    } catch (err) {
      console.error('Service worker install error (ignored):', err)
    }
  })())
  self.skipWaiting?.()
})

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE && k !== IMAGE_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim?.()
})

// Message handling for offline/online status
self.addEventListener('message', evt => {
  if (evt.data?.type === 'SKIP_WAITING') {
    self.skipWaiting?.()
  } else if (evt.data?.type === 'GET_CACHE_SIZE') {
    // Return cache size info
    caches.keys().then(keys => {
      let totalSize = 0
      return Promise.all(
        keys.map(key =>
          caches.open(key).then(cache =>
            cache.keys().then(requests => {
              return Promise.all(
                requests.map(req =>
                  cache.match(req).then(res => {
                    if (res?.blob) {
                      return res.blob().then(b => totalSize += b.size)
                    }
                  })
                )
              )
            })
          )
        )
      ).then(() => {
        evt.ports[0].postMessage({ cacheSize: totalSize, cacheCount: keys.length })
      })
    })
  }
})

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return

  const url = new URL(evt.request.url)
  const isNav = evt.request.mode === 'navigate'
  const isHTML = (evt.request.headers.get('accept') || '').includes('text/html')
  const isImage = CACHE_PATTERNS.images.test(url.pathname)
  const isAsset = CACHE_PATTERNS.assets.test(url.pathname)

  // Images: cache first, fallback to network
  if (isImage && url.origin === self.location.origin) {
    return evt.respondWith(
      (async () => {
        const cached = await caches.match(evt.request)
        if (cached) return cached

        try {
          const res = await fetch(evt.request)
          if (res?.ok) {
            const cache = await caches.open(IMAGE_CACHE)
            cache.put(evt.request, res.clone())
          }
          return res
        } catch {
          return cached || new Response('', { status: 503 })
        }
      })()
    )
  }

  // Assets (JS/CSS): cache first, fallback to network
  if (isAsset && url.origin === self.location.origin) {
    return evt.respondWith(
      (async () => {
        const cached = await caches.match(evt.request)
        if (cached) return cached

        try {
          const res = await fetch(evt.request)
          if (res?.ok) {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(evt.request, res.clone())
          }
          return res
        } catch {
          return new Response('', { status: 503 })
        }
      })()
    )
  }

  // HTML: network first, fallback to cache
  if ((isNav || isHTML) && url.origin === self.location.origin) {
    return evt.respondWith(
      (async () => {
        try {
          const res = await fetch(evt.request)
          if (res?.ok) {
            const cache = await caches.open(RUNTIME_CACHE)
            cache.put(evt.request, res.clone())
          }
          return res
        } catch {
          const cached = await caches.match('/index.html') || await caches.match(evt.request)
          return cached || new Response('', { status: 503 })
        }
      })()
    )
  }

  // Default: network first, cache fallback
  evt.respondWith(
    (async () => {
      try {
        const cached = await caches.match(evt.request)
        const res = await fetch(evt.request)
        if (res?.ok && url.origin === self.location.origin) {
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(evt.request, res.clone())
        }
        return res
      } catch {
        const cached = await caches.match(evt.request)
        if (cached) return cached
        return new Response('', { status: 503 })
      }
    })()
  )
})
