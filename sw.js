const CACHE_NAME = 'tir-koridor-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './corridors.geojson',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Dosyaları önbelleğe al
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Çevrimdışı veya zayıf ağda önbellekten sun
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
