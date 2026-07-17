const CACHE_NAME = 'taha-alhaty-v1';

// الملفات الأساسية التي يجب تخزينها فوراً لتشغيل التطبيق بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'images/logotaha.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap'
];

// تثبيت السيرفيس وركر وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل السيرفيس وركر وتنظيف الكاش القديم عند التحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// إدارة الطلبات واستراتيجية التسريع الذكي للبيانات والصور
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. استراتيجية خاصة بملف جوجل شيت (CSV): نطلبها دائماً من الشبكة أولاً لضمان تحديث الأسعار والمنيو فوراً
  if (requestUrl.href.includes('docs.google.com/spreadsheets')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // حفظ نسخة احتياطية في الكاش للرجوع إليها في حال انقطاع الإنترنت بالكامل
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // في حال عدم وجود إنترنت، يتم جلب النسخة المخزنة مسبقاً
          return caches.match(event.request);
        })
    );
    return;
  }

  // 2. استراتيجية باقي الملفات (الصور والخطوط والأكواد): جلب من الكاش أولاً لتوفير السرعة الفائقة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث الخلفية في صمت إذا تم تغيير أي ملف ثابت على السيرفر
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* تجاهل خطأ عدم وجود شبكة أثناء التحديث الصامت */});
        
        return cachedResponse;
      }

      // إذا لم يكن الملف مخزناً في الكاش، قم بجلبه من الشبكة وحفظه للمرات القادمة
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // لا تقم بتخزين طلبات chrome-extension أو الروابط الخارجية غير الأمنة
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, responseToCache);
          }
        });
        return networkResponse;
      });
    })
  );
});
