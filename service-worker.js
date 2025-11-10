const CACHE_NAME = 'devinsfarm-static-v1'

// Keep the pre-cache list minimal (avoid referencing source files that don't exist in production)
const ASSETS = [
  '/',
  '/index.html'
]

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
