// Service Worker - Meu Estudo (Offline-First Asset Strategy)
const CACHE_NAME = '__SW_CACHE_VERSION__';
const PRECACHE_ASSETS = /* __PRECACHE_MANIFEST__ */ ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.map((name) => (name !== CACHE_NAME ? caches.delete(name) : Promise.resolve()))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache version.json so update detector stays live
  if (url.pathname.endsWith('/version.json') || url.pathname === '/version.json') {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Navigation documents: NetworkFirst with offline fallback to cached shell
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match('./')) || (await caches.match('./index.html')))
    );
    return;
  }

  // Immutable hashed assets (JS, CSS, WOFF2 fonts): CacheFirst
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // Remaining static assets (manifest, icons): StaleWhileRevalidate
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
