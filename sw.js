const CACHE_NAME = 'taha-elhaty-v1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './images/logotaha.png'
];

// تثبيت السيرفس وركر
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// تفعيل السيرفس وركر
self.addEventListener('activate', e => {
  console.log('Service Worker Activated');
});

// حدث الـ Fetch الضروري لقبول التثبيت كـ App
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
