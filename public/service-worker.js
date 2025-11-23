// Use a version-based cache name for better control
const CACHE_VERSION = '1.0.2'; // Updated version
const CACHE_NAME = 'devinsfarm-static-v' + CACHE_VERSION;
const RUNTIME_CACHE = 'devinsfarm-runtime-v' + CACHE_VERSION;

// Pre-cache all essential files for offline functionality
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/index-BU7lPFmw.css',
  '/assets/currency-EbIO-V_7.js',
  '/assets/Login-DQO81TT9.js',
  '/assets/enhancedSettings-Cd0HS9If.js',
  '/assets/BackupRestore-Cbj1WTTA.js',
  '/assets/NotificationCenter-az6uB2Sy.js',
  '/assets/AuditLog-BpEl47SB.js',
  '/assets/AdditionalReports-CLquNcpX.js',
  '/assets/lib-notifications-DRlqN2Ug.js',
  '/assets/BulkOperations-Btel7aiS.js',
  '/assets/SyncSettings-BwMmtW2r.js',
  '/assets/lib-core-XQuPJE47.js',
  '/assets/AdvancedAnalytics-BJjd4tCi.js',
  '/assets/lib-integration-BbDxlnyI.js',
  '/assets/CalendarView-CcEIfWtq.js',
  '/assets/Tasks-D972bcJ9.js',
  '/assets/EnhancedSettings-CaQtDSPq.js',
  '/assets/lib-export-Dp5-osfT.js',
  '/assets/Groups-5Igy3eDL.js',
  '/assets/Dashboard-DBxw2bUp.js',
  '/assets/Finance-DcY7Sl24.js',
  '/assets/purify.es-C65SP4u9.js',
  '/assets/CanineManagement-CZ5OCT6_.js',
  '/assets/Pastures-DlNkE8D2.js',
  '/assets/CropsWithSubsections-B9ExXBHt.js',
  '/assets/HealthSystem-DNTtD4Lw.js',
  '/assets/index-B8h0ewlP.js',
  '/assets/Inventory-6nDiqI35.js',
  '/assets/Reports-Bloya2MF.js',
  '/assets/Schedules-B1WemSV9.js',
  '/assets/vendor-react-C41AW3-e.js',
  '/assets/index.es-DghfK7ub.js',
  '/assets/html2canvas.esm-Ge7aVWlp.js',
  '/assets/PetManagement-Bfic21Gb.js',
  '/assets/Animals-DjlQzlBd.js',
  '/assets/index-CMzQl4t4.js',
  '/assets/vendor-firebase-DPzZ0AXH.js',
  '/assets/pdfExport-Bg-bYHF1.js'
];

self.addEventListener('install', evt => {
  // Attempt to cache listed assets but never allow an error to cause the install to fail.
  evt.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const asset of ASSETS) {
        try {
          const res = await fetch(asset, { cache: 'no-store' });
          if (res && res.ok) await cache.put(asset, res.clone());
        } catch (err) {
          // Log and continue. don't rethrow.
          console.warn('Asset cache failed for', asset, err);
        }
      }
    } catch (err) {
      // Very defensive: any unexpected error should be logged but not fail install.
      console.error('Service worker install error (ignored):', err);
    }
  })());
  // Activate the new SW as soon as it's finished installing
  try { self.skipWaiting(); } catch (e) { /* ignore */ }
  try { console.log('ServiceWorker installed, cache=', CACHE_NAME); } catch (e) { /* ignore */ }
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Allow the page to tell the SW to skipWaiting and activate immediately
self.addEventListener('message', (evt) => {
  try {
    if (!evt.data) return;
    if (evt.data.type === 'SKIP_WAITING') {
      try { self.skipWaiting(); } catch(e){/* empty */}
    }
  } catch (e) {
    /* ignore */
  }
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  
  const url = new URL(evt.request.url);
  const isNavigation = evt.request.mode === 'navigate';
  const wantsHtml = (evt.request.headers.get('accept') || '').includes('text/html');
  const isSameOrigin = url.origin === self.location.origin;
  
  evt.respondWith((async () => {
    try {
      // Try cache first for better offline experience
      const cached = await caches.match(evt.request);
      
      // For same-origin requests, try network and update cache
      if (isSameOrigin) {
        try {
          const fres = await fetch(evt.request);
          const contentType = fres.headers.get('content-type') || '';
          const isHtmlResp = contentType.includes('text/html');
          
          // Prevent HTML being cached as assets
          if (isHtmlResp && !wantsHtml) {
            throw new Error('Unexpected HTML response for non-navigation request');
          }
          
          // Cache successful responses
          if (fres.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(evt.request, fres.clone()).catch(e => 
              console.warn('Cache put failed:', e)
            );
          }
          return fres;
        } catch (networkErr) {
          // Network failed - return cached version if available
          if (cached) {
            console.log('Serving from cache (offline):', evt.request.url);
            return cached;
          }
          throw networkErr;
        }
      }
      
      // For external resources, try network first, then cache
      if (cached) return cached;
      return await fetch(evt.request);
      
    } catch (err) {
      // Final fallback for navigation requests
      if (isNavigation || wantsHtml) {
        const offlineFallback = await caches.match('/offline.html');
        if (offlineFallback) {
          console.log('Serving offline.html as offline fallback');
          return offlineFallback;
        }
      }
      
      // For assets/API calls when offline, return proper error
      console.error('Fetch failed and no cache available:', evt.request.url, err);
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'You are offline and this resource is not cached',
          url: evt.request.url 
        }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  })());
});
