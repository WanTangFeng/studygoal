const CACHE = 'studygoal-pwa-v1';
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(PRECACHE);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
      return caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 页面导航：优先网络，离线回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      const c = r.clone();
      caches.open(CACHE).then(function (ca) { ca.put('./index.html', c); });
      return r;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  // 其它资源：优先缓存，后台更新
  e.respondWith(caches.match(req).then(function (r) {
    if (r) {
      fetch(req).then(function (rr) {
        const c = rr.clone();
        caches.open(CACHE).then(function (ca) { ca.put(req, c); });
      }).catch(function () {});
      return r;
    }
    return fetch(req).then(function (rr) {
      const c = rr.clone();
      caches.open(CACHE).then(function (ca) { ca.put(req, c); });
      return rr;
    }).catch(function () { return caches.match('./'); });
  }));
});
