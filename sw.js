const CACHE_NAME = 'taha-alhaty-v2';

// الملفات الأساسية الواجب كاشها لضمان سرعة الفتح الأولي
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/logotaha.png',
  './images/default.jpg'
];

// تثبيت الـ Service Worker وكاش الملفات الثابتة فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [PWA] Caching foundational assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// تنظيف الكاش القديم تلقائياً عند تحديث الأبلكيشن
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

// معالجة الطلبات الذكية (سرعة + جلب أحدث البيانات أونلاين)
self.addEventListener('fetch', (event) => {
  const requestUrl = new Error(event.request.url);
  
  // استبعاد طلبات شيت جوجل والواتساب من الكاش الصارم لضمان التحديث اللحظي للأسعار
  if (event.request.url.includes('docs.google.com') || event.request.url.includes('wa.me')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // استراتيجية التشغيل السريع للملفات الداخلية للموقع
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // تأكد من نجاح الاستجابة قبل وضعها في الكاش
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // إذا كان المستخدم أوفلاين أو الشبكة معطلة، يتم الاستعانة بالكاش فوراً
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا كان الطلب لصفحة غير موجودة بالكاش، اعرض الصفحة الرئيسية الافتراضية
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
