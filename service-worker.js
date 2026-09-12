const CACHE_NAME = 'qingan-loan-v5';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 估價頁會帶 ?price= 進來。查詢字串不同就視為不同網址的話，
    // 既命不中既有快取（離線就開不了），又會把每一個價格各存一份。
    caches.match(event.request, {ignoreSearch: true}).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          const noQuery = !new URL(event.request.url).search;
          if (event.request.method === 'GET' && noQuery && networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
