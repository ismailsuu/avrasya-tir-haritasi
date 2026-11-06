const CACHE_NAME = 'tir-koridor-v13-live';

// Kurulum aşamasında bekleme yapmadan hemen devreye gir
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Eski sürüme ait tüm önbellekleri temizle ve kontrolü devral
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

// Network First Stratejisi
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1. Sadece GET isteklerini ve http/https protokollerini işle
  if (req.method !== 'GET' || !req.url.startsWith('http')) {
    return;
  }

  e.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Geçerli bir yanıt geldiyse (status 200) önbelleğe kaydet
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Çevrimdışı (offline) durumunda önbellekten sun
        return caches.match(req);
      })
  );
});
