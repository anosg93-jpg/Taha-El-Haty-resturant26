const CACHE_NAME = 'taha-hati-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images/logotaha.png'
];

// حدث التثبيت - كاش للملفات الأساسية فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // إجبار التنشيط الفوري بدون انتظار إغلاق التابات القديمة
  );
});

// حدث التفعيل - حذف الكاش القديم تماماً لضمان عدم حدوث تضارب
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // السيطرة على كل التابات المفتوحة فوراً
  );
});

// حدث جلب البيانات - ذكي وسريع ويضمن التثبيت
self.addEventListener('fetch', (event) => {
  // تخطي الطلبات الخارجية مثل جوجل شيت لتعمل بلحظتها دائماً
  if (event.request.url.includes('google.com') || event.request.url.includes('spreadsheets')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // نرجع النسخة المكيشة بسرعة، وفي الخلفية نحدثها من الشبكة لو فيه جديد
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* صامت في حالة الأوفلاين */ });
        
        return cachedResponse;
      }

      // لو مش مكيش هاته من الشبكة عادي
      return fetch(event.request);
    })
  );
});
