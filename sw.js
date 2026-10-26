// Caches the app shell so Noor opens offline. Videos, the database and call rooms always use the network.
const CACHE = 'noor-v65';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png',
               'js/config.js', 'js/core.js', 'js/backend.js', 'js/features.js', 'js/quran-data.js', 'js/quran.js', 'js/faith.js', 'js/scholar.js', 'js/family.js', 'js/audio.js', 'js/events.js', 'js/voice.js', 'js/cities.js', 'js/iman.js', 'js/install.js', 'install.html',
               'photos/shaykh-1.jpg', 'photos/shaykh-2.jpg', 'photos/shaykh-3.jpg'];

// Push notifications (OneSignal) — only loaded when an app id is set in js/config.js.
try {
  importScripts('js/config.js');
  if (self.NOOR_CONFIG && self.NOOR_CONFIG.oneSignalAppId) importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // leave YouTube, Firebase, fonts alone
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
