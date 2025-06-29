const cacheFiles = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./xlsx.full.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("v1.0.19").then(cache => {
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});