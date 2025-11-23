
const CACHE_NAME = 'devinsfarm-static-v3'
const RUNTIME_CACHE_NAME = 'devinsfarm-runtime-v3'
const SYNC_QUEUE_NAME = 'sync-queue'

// Comprehensive list of assets to pre-cache for full offline functionality
const ASSETS_TO_CACHE = [
  /* Core App Shell */
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/offline.html',
  '/src/styles.css',
  '/src/main.jsx',
  '/src/App.jsx',

  /* App Modules (Lazy Loaded) */
  '/src/modules/Dashboard.jsx',
  '/src/modules/NotificationCenter.jsx',
  '/src/modules/Animals.jsx',
  '/src/modules/Tasks.jsx',
  '/src/modules/Finance.jsx',
  '/src/modules/Schedules.jsx',
  '/src/modules/CropsWithSubsections.jsx',
  '/src/modules/Reports.jsx',
  '/src/modules/Inventory.jsx',
  '/srcmodules/Groups.jsx',
  '/src/modules/Pastures.jsx',
  '/src/modules/HealthSystem.jsx',
  '/src/modules/Login.jsx',
  '/src/modules/AuditLog.jsx',
  '/src/modules/BackupRestore.jsx',
  '/src/modules/SyncSettings.jsx',
  '/src/modules/AdvancedAnalytics.jsx',
  '/src/modules/EnhancedSettings.jsx',
  '/src/modules/BulkOperations.jsx',
  '/src/modules/AdditionalReports.jsx',
  '/src/modules/PetManagement.jsx',
  '/srcmodules/CanineManagement.jsx',
  '/src/modules/CalendarView.jsx',
  '/src/modules/CropAdd.jsx',
  '/src/modules/CropSales.jsx',
  '/src/modules/CropTreatment.jsx',
  '/src/modules/CropYield.jsx',
  '/src/modules/Crops.jsx',
  '/src/modules/AnimalBreeding.jsx',
  '/src/modules/AnimalFeeding.jsx',
  '/src/modules/AnimalMeasurement.jsx',
  '/src/modules/AnimalMilkYield.jsx',
  '/src/modules/AnimalTreatment.jsx',

  /* UI Components */
  '/src/components/Calendar.jsx',
  '/src/components/Charts.jsx',
  '/srcic/components/OfflineIndicator.jsx',
  '/src/components/PhotoGallery.jsx',
  '/src/components/VoiceInput.jsx',

  /* Core Libraries */
  '/src/lib/theme.jsx',
  '/src/lib/auth.js',
  '/src/lib/audit.js',
  '/src/lib/appSettings.js',
  '/src/lib/notifications.js',
  '/src/lib/autoNotifications.js',
  '/src/lib/sync.js',
  '/src/lib/storage.js',
  '/src/lib/firebase.js',
  '/src/lib/firebaseAuth.js',
  '/src/lib/offlineSync.js',

  /* Image & Icon Assets */
  '/assets/bg-farm.svg',
  '/assets/bg-fields.svg',
  '/assets/logo-badge.svg',
  '/assets/logo-icon.svg',
  '/assets/logo-wordmark.svg',
  '/public/assets/jr-farm-logo-light.svg',
  '/public/assets/jr-farm-logo.svg',
  '/public/icons/icon-128.svg',
  '/public/icons/icon-192.svg',
  '/public/icons/icon-512.svg',

  /* Font Assets */
  '/assets/fonts/Poppins-Regular.ttf',
  '/assets/fonts/Poppins-Medium.ttf',
  '/assets/fonts/Poppins-Bold.ttf',
  '/assets/fonts/Poppins-ExtraBold.ttf',
  '/assets/fonts/Roboto-Regular.ttf',
  '/assets/fonts/Rubik-Regular.ttf'
];


// --- SERVICE WORKER LOGIC (UNCHANGED) ---

self.addEventListener('install', evt => {
  evt.waitUntil((async () => {
    console.log('SW Install: Caching all application assets');
    try {
      const cache = await caches.open(CACHE_NAME);
      // Use addAll for atomic caching
      await cache.addAll(ASSETS_TO_CACHE);
      console.log('SW Install: All assets cached successfully');
    } catch (err) {
      console.error('SW Install: Caching failed, some assets may be unavailable offline.', err);
      // Don't prevent SW installation, runtime caching will still work.
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', evt => {
  evt.waitUntil((async () => {
    // Delete old caches
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE_NAME)
        .map(k => {
          console.log(`SW Activate: Deleting old cache ${k}`);
          return caches.delete(k);
        })
    );
    await self.clients.claim();
    console.log('SW Activated and old caches cleared.');
  })());
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  
  evt.respondWith((async () => {
    try {
      // 1. Cache First
      const cachedResponse = await caches.match(evt.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Network Fetch
      const networkResponse = await fetch(evt.request);
      
      // 3. Cache and Return
      if (networkResponse && networkResponse.ok && evt.request.url.startsWith(self.location.origin)) {
        const cache = await caches.open(RUNTIME_CACHE_NAME);
        // Dont await cache put to avoid delaying response
        cache.put(evt.request, networkResponse.clone()).catch(err => {
            console.warn('SW Fetch: Runtime cache put failed:', err);
        });
      }
      
      return networkResponse;
    } catch (err) {
      // 4. Offline Fallback
      console.warn('SW Fetch: Network request failed, trying offline fallbacks.', evt.request.url);
      
      const cachedResponse = await caches.match(evt.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // For navigation requests, return the main index.html file
      if (evt.request.mode === 'navigate') {
        const indexCache = await caches.match('/index.html');
        if (indexCache) {
          return indexCache;
        }
      }
      
      // For images, return a placeholder if you have one
      if (evt.request.headers.get('accept')?.includes('image')) {
        // You could return a placeholder SVG here
      }

      // Last resort: return a generic offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'The requested resource is not available in the cache.',
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

// --- SYNC LOGIC (UNCHANGED) ---

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('devinsfarm-sync', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
        db.createObjectStore(SYNC_QUEUE_NAME, { autoIncrement: true });
      }
    };
  });
}

self.addEventListener('message', evt => {
  if (evt.data && evt.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
