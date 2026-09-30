// Yatra Now Service Worker - High Performance Offline & Cache Engine
// Optimized for Low-End Smartphones (Tier 1: 1GB-2GB RAM)

const CACHE_NAME = 'yatranow-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/theme.css',
  './css/navbar.css',
  './css/sheets.css',
  './css/modals.css',
  './css/portals.css',
  './assets/logo_bus.svg',
  './assets/logo_wordmark.svg',
  './js/cryptoService.js',
  './js/authService.js',
  './js/busData.js',
  './js/mapService.js',
  './js/uiController.js',
  './js/ownerPortal.js',
  './js/crewPortal.js',
  './js/adminPortal.js',
  './js/app.js'
];

// Install Event - Pre-cache App Shell (<350KB total footprint)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Yatra Now SW] Pre-caching offline application shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Yatra Now SW] Removing stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First for assets, Network-First for dynamic telemetry
self.addEventListener('fetch', (event) => {
  // If fetching map tiles or telemetry API, use network with fallback
  if (event.request.url.includes('tile.openstreetmap.org') || event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // App shell: Cache first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously fetch fresh copy
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
