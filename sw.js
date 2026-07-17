const CACHE_NAME = 'taha-elhaty-force-v3';

// استراتيجية التشغيل الفوري والتحكم الكامل في الصفحة من أول ثانية
self.addEventListener('install', event => {
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// هذا الحدث هو المفتاح الحاسم لقبول جوجل كروم لزر "تثبييييييت"
self.addEventListener('fetch', event => {
  // تخطي طلبات الـ Chrome Extensions والـ Analytics عشان ميعملش Error
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // إذا كانت الاستجابة صالحة، قم بنسخها في الكاش بشكل ديناميكي
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // إذا كان العميل أوفلاين، ابحث عنها في الكاش
        return caches.match(event.request);
      })
  );
});
