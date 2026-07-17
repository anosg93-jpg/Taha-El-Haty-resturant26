const CACHE_NAME = 'taha-alhaty-v3';

// كاش فقط الملفات الأساسية الضامنين وجودها لضمان نجاح التثبيت بنسبة 100%
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [PWA] Caching critical assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// تنظيف وتحديث الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 [PWA] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// إدارة الطلبات والسرعة (تحديث ديناميكي خلفي)
self.addEventListener('fetch', (event) => {
  // استبعاد شيت جوجل والواتساب تماماً من الكاش الصارم لضمان التحديث اللحظي للأسعار والطلبات
  if (event.request.url.includes('docs.google.com') || event.request.url.includes('wa.me')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // إذا الملف موجود في الكاش، اعرضه فوراً للعميل لسرعة خارقة
        // وفي نفس الوقت اطلب النسخة الجديدة من السيرفر في الخلفية لتحديث الكاش مستقبلاً
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* تجاهل خطأ الشبكة في الخلفية */});
        
        return cachedResponse;
      }

      // إذا لم يكن في الكاش، اجلبه من الشبكة بشكل طبيعي
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
