const CACHE_NAME = 'tir-koridor-v9-live';

// Kurulum aşamasında bekleme yapmadan hemen devreye gir
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Eski önbelleklerin tamamını hafızadan sil
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network First: Önce güncel dosyayı internetten çek, ağ yoksa önbellekten aç
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Gelen yeni dosyayı önbelleğe de yedekle
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(e.request)) // İnternet kesilirse önbellekten ver
  );
});
