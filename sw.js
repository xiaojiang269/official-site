/* 550W 综合指挥系统 - Service Worker（PWA 离线缓存） */
var CACHE_NAME = '550w-cache-v1';
var CORE_ASSETS = [
  '550w.html',
  'assets/550w-icon-192.png',
  'assets/550w-icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, copy); }).catch(function() {});
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(hit) { return hit || caches.match('550w.html'); });
    })
  );
});
