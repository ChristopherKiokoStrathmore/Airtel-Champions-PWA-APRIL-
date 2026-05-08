// Service worker with enhanced update detection and cache management
const CACHE_VERSION = 'airtel-champions-v1';
const CACHE_NAME = CACHE_VERSION;
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files, but don't fail if some don't exist (dev mode)
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url, { cache: 'no-store' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                // Silently skip missing files (e.g., icons in dev)
              })
          )
        );
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients immediately without waiting for reload
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network-first strategy for HTML documents (index.html, etc.)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // Cache the response for offline fallback
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request)
            .then(response => response || caches.match('/'))
            .catch(() => {
              return new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }

  // Stale-while-revalidate for other resources (JS, CSS, etc.)
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached response while updating in background
        if (response) {
          // Revalidate in background
          fetch(request, { cache: 'no-store' })
            .then((freshResponse) => {
              if (freshResponse.ok) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, freshResponse);
                });
              }
            })
            .catch(() => {
              // Silently handle fetch errors during background update
            });
          
          return response;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle service worker messages for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache on request');
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    });
  }
});
