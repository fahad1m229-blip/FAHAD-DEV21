/* FAHAD DEV — Progressive Web App Service Worker
 * Caches static shell assets for instant loading and provides offline.html fallback.
 * Skips Firestore/Google APIs so real-time listeners never serve stale auth/API responses.
 */
const CACHE_VERSION = 'fahad-dev-v1.0.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/firebase-config.js',
  './assets/js/firebase-service.js',
  './assets/js/ui.js',
  './assets/js/three-background.js',
  './assets/js/translations.js',
  './assets/img/logo.svg',
  './assets/img/og-banner.svg',
  './assets/img/video-thumb.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Firebase, Google APIs, live firebase-config.js, or hidden/admin routes
  if (
    url.origin !== self.location.origin ||
    url.pathname.includes('/FAHAD/admin') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.endsWith('/firebase-config.js')
  ) {
    return;
  }

  // Navigation requests: network first, fallback to cached index or offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('./offline.html');
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
