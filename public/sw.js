const CACHE_NAME = 'review-buddy-v1-11-1';
const APP_SHELL = [
  './',
  './manifest.webmanifest',
  './review-buddy-icon.svg',
  './review-buddy-icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = request.mode === 'navigate';
  const shouldRefreshFromNetwork =
    isNavigationRequest ||
    request.destination === 'document' ||
    requestUrl.pathname.endsWith('/manifest.webmanifest');

  event.respondWith(
    (shouldRefreshFromNetwork
      ? fetch(request)
          .then((response) => {
            if (response.ok && !requestUrl.pathname.includes('/api/')) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }

            return response;
          })
          .catch(() => caches.match(request).then((cached) => cached || caches.match('./')))
      : caches.match(request).then((cached) => {
          const fetchAndCache = fetch(request)
            .then((response) => {
              if (!response.ok || requestUrl.pathname.includes('/api/')) {
                return response;
              }

              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              return response;
            })
            .catch(() => cached || caches.match('./'));

          return cached || fetchAndCache;
        })),
  );
});
