const CACHE_NAME = 'taha-hati-v1'; // قم بتغيير الإصدار هنا فقط عند تغيير جذري في ملفات الـ CSS/JS
const ASSETS = [
  'index.html',
  'manifest.json'
];

// التثبيت الأولي
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

// التفعيل وتنشيط التحديثات
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
});

// استراتيجية التحديث: Network First (لضمان أحدث نسخة من الـ Index)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا كان الطلب هو الـ index، قم بتحديث الكاش
        if (event.request.url.includes('index.html')) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
