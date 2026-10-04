/* Zaicha service worker (Session 8) — sirf app-shell cache karta hai taake
   app Windows/Mac/Android/iPhone par install ho sake aur tez khule.
   /api/* kabhi cache NAHI hota (har zaicha hamesha taaza server se).
   v10 (pass 2.2, app lock): the lock page is never cached, and when the server
   answers "locked" the cached app shell is deleted, so a locked visitor is
   never shown the app from cache (not even offline). */
const CACHE = 'zaicha-shell-v10';
const SHELL = ['/', '/tehzeeb-logo.svg', '/preface-content.js', '/zaicha-skin.css', '/zaicha-ui.js', '/i18n-extra.js', '/i18n-hi.js', '/i18n-ar.js', '/i18n-zh.js', '/i18n-s8.js', '/learn-content.js', '/planet-house.js', '/icon.svg', '/icon-192.png', '/manifest.webmanifest'];
function isLockResponse(res) { return !!res && (res.status === 401 || res.headers.get('X-Zaicha-Locked') === '1'); }
function dropShell() { return caches.keys().then((keys) => Promise.all(keys.filter((k) => k.indexOf('zaicha-shell-') === 0).map((k) => caches.delete(k)))); }
self.addEventListener('install', (e) => {
  // Fill the shell only if the app is not locked for this browser right now.
  e.waitUntil(fetch('/', { credentials: 'same-origin', cache: 'no-store' }).then((r) => {
    if (isLockResponse(r) || !r.ok) return null;
    return caches.open(CACHE).then((c) => c.addAll(SHELL));
  }).catch(() => null).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/lock.html') return;   // never touch the lock page
  // Network-first (naya version foran mile), offline par cache.
  e.respondWith(
    fetch(req).then((res) => {
      if (isLockResponse(res)) { dropShell(); return res; }       // locked: show the lock page, forget the app
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});
