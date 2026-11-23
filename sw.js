// 오프라인에서도 앱이 열리도록 화면 파일과 라이브러리를 캐시한다.
// index.html을 고치면 아래 버전을 올리지 않아도 온라인일 때 새 파일을 먼저 받는다.
const CACHE = 'diary-v1';
const ASSETS = [
  './', './index.html', './manifest.json', './icon-180.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 내 파일: 네트워크 먼저, 안 되면 캐시
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    // 라이브러리: 캐시 먼저
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
  // 날씨 API 등은 건드리지 않음
});
