/* 九星霸体诀 · Service Worker：离线缓存（游戏为纯静态，可整站离线） */
const CACHE = 'jsxing-v8';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/data2.js',
  './js/social.js',
  './js/game.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 缓存优先，后台更新；离线时兜底回 index.html */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok) {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
      return hit || net;
    })
  );
});
