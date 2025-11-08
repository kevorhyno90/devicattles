const CACHE_NAME = 'cattalytics-static-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/styles.css'
]

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return
  evt.respondWith(
    caches.match(evt.request).then(res => res || fetch(evt.request).then(fres => {
      // cache fetched assets on the fly (lightweight)
      if (evt.request.url.startsWith(self.location.origin)) {
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, fres.clone()))
      }
      return fres
    }).catch(()=>caches.match('/index.html')))
  )
})
