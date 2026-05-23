/**
 * Airtel Champions — Service Worker
 * Strategy:
 *   • Static assets  → Cache-first (fast loads, updates in background)
 *   • API calls       → Network-only (Supabase, always fresh)
 *   • Navigation     → Network-first with offline fallback to cached index.html
 *   • Icons/manifest → Cache-first forever
 */

const VERSION = 'v1.0.0';
const STATIC_CACHE  = `ac-static-${VERSION}`;
const RUNTIME_CACHE = `ac-runtime-${VERSION}`;

// App shell — precached on install so the app works offline immediately
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-192.svg',
  '/icons/icon-maskable-512.svg',
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Airtel Champions service worker', VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        // addAll will fail silently if any file is missing — use individual adds
        return Promise.allSettled(
          APP_SHELL.map((url) =>
            cache.add(url).catch((err) =>
              console.warn('[SW] Could not precache', url, err.message)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] ✅ App shell cached — skipping waiting');
        return self.skipWaiting();
      })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('ac-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] ✅ Activated — claiming clients');
      return self.clients.claim();
    })
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ① Only handle GET requests
  if (request.method !== 'GET') return;

  // ② Skip Supabase API calls — always go to network (live data)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.pathname.startsWith('/rest/v1/') ||
    url.pathname.startsWith('/auth/v1/') ||
    url.pathname.startsWith('/storage/v1/')
  ) {
    return; // browser default (network)
  }

  // ③ Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // ④ Navigation requests (HTML pages) → Network-first, fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Offline — serving cached index.html');
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // ⑤ Static assets (/assets/, /icons/, fonts, images) → Cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|otf)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ⑥ Everything else → Network-first, cache as fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────────────────────────
// Fires when connectivity is restored after queueing offline submissions.
// We message the app to process its queue (Supabase credentials stay in-app).
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync triggered:', event.tag);

  if (event.tag === 'sync-submissions' || event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          if (clients.length === 0) {
            console.log('[SW] No clients open — sync deferred until next open');
            return;
          }
          clients.forEach((client) => {
            client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
            console.log('[SW] ✅ Sent PROCESS_OFFLINE_QUEUE to client');
          });
        })
    );
  }
});

// ─── PERIODIC BACKGROUND SYNC ────────────────────────────────────────────────
// Wakes the app periodically (even when closed) to refresh leaderboard,
// announcements, and mission data so the next open feels instant.
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] ⏱️ Periodic sync triggered:', event.tag);

  if (event.tag === 'refresh-leaderboard') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          if (windowClients.length > 0) {
            windowClients.forEach((client) => {
              client.postMessage({ type: 'PERIODIC_REFRESH', data: 'leaderboard' });
            });
            console.log('[SW] ✅ Sent PERIODIC_REFRESH leaderboard to', windowClients.length, 'client(s)');
          }
          // If no clients are open the browser handles retry automatically
        })
    );
  }

  if (event.tag === 'refresh-announcements') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({ type: 'PERIODIC_REFRESH', data: 'announcements' });
          });
        })
    );
  }
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Airtel Champions', body: event.data.text() };
  }

  const title   = payload.title  || 'Airtel Champions';
  const options = {
    body:    payload.body    || '',
    icon:    payload.icon    || '/icons/icon-192.svg',
    badge:   payload.badge   || '/icons/icon-192.svg',
    tag:     payload.tag     || 'airtel-champions',
    data:    { url: payload.url || '/', ...(payload.data || {}) },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open',    title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss'  },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});