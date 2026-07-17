const CACHE_NAME = 'taha-elhaty-v2';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './images/logotaha.png'
];

// التثبيت وعمل كاش للملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    }).then(() => self.skipWaiting()) // إجبار التحديث الفوري
  );
});

// تفعيل وتحرير الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // الاستحواذ الفوري على الصفحات المفتوحة
  );
});

// حدث الـ Fetch الإجباري لقبول تثبيت التطبيق بشكل مستقل
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
