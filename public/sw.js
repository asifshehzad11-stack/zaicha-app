/* Zaicha service worker (Session 8) — sirf app-shell cache karta hai taake
   app Windows/Mac/Android/iPhone par install ho sake aur tez khule.
   /api/* kabhi cache NAHI hota (har zaicha hamesha taaza server se). */
const CACHE = 'zaicha-shell-v8b';
const SHELL = ['/', '/zaicha-skin.css', '/zaicha-ui.js', '/i18n-extra.js', '/i18n-hi.js', '/i18n-ar.js', '/i18n-zh.js', '/i18n-s8.js', '/learn-content.js', '/planet-house.js', '/icon.svg', '/icon-192.png', '/manifest.webmanifest'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  // Network-first (naya version foran mile), offline par cache.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});
