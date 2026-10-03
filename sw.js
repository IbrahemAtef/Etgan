/**
 * «إِتْقَانْ» - عامل الخدمة للعمل أوفلاين بنسبة 100% (Service Worker)
 */

const CACHE_NAME = "etgan-pwa-v12";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/quran-data.js",
  "./js/storage.js",
  "./js/app.js",
  "./assets/Etgan.png",
  "./assets/favicon.svg",
  "./manifest.webmanifest"
];

// تثبيت عامل الخدمة وتخزين الأصول محلياً
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل عامل الخدمة ومسح الكاش القديم
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية Cache First مع Fallback إلى Network
self.addEventListener("fetch", event => {
  // تجاهل الطلبات غير المدعومة (مثل بروتوكولات الإضافات chrome-extension)
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // تخزين أي خطوط أو أصول خارجية جديدة في الكاش
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حال عدم وجود إنترنت وفشل الكاش
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
