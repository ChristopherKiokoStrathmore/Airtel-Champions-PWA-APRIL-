// Simple service worker for PWA functionality
const CACHE_NAME = 'airtel-champions-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files, but don't fail if some don't exist (dev mode)
        return Promise.all(
          urlsToCache.map(url => 
            fetch(url)
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
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .catch((error) => {
            // Return offline response or cached fallback
            console.debug('[SW] Fetch failed for:', event.request.url, error);
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
      .catch(() => {
        // Fallback if cache itself fails
        return new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      })
  );
});
