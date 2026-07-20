const CACHE_NAME = 'taha-alhaty-v8';

// الملفات الثابتة الأساسية التي سيتم حفظها في ذاكرة الهاتف لسرعة تفتح فورية
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap'
];

// تثبيت السيرفيس وركر وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل وتحديث الملفات وحذف الكاش القديم بأمان
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية جلب البيانات الذكية (تضمن السرعة والأمان وعدم تعليق الأسعار)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // إذا كان الطلب قادم من جوجل شيت (تحديث المنيو والأسعار)، يفضل جلب الجديد دائماً من الإنترنت أولاً لضمان الدقة
  if (requestUrl.href.includes('docs.google.com/spreadsheets')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // حفظ نسخة احتياطية في الكاش للطوارئ لو انقطع الإنترنت
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // لو الإنترنت مقطوع تماماً، يتم فتح آخر منيو تم كاشه بأمان دون إظهار شاشة بيضاء
          return caches.match(event.request);
        })
    );
  } else {
    // لباقي الملفات والصور والأكواد: افتح من الكاش فوراً لسرعة البرق، وإذا لم تجدها جلبها من الشبكة
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // عدم كاش روابط الفيس بوك أو الوتساب الخارجية
            if (!requestUrl.href.includes('wa.me') && !requestUrl.href.includes('facebook.com')) {
              cache.put(event.request, responseToCache);
            }
          });
          return networkResponse;
        });
      })
    );
  }
});
