// Caches the app shell so Noor opens offline. Videos, the database and call rooms always use the network.
const CACHE = 'noor-v120';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png',
               'js/config.js', 'js/core.js', 'js/backend.js', 'js/features.js', 'js/account.js', 'js/quran-data.js', 'js/quran.js', 'js/faith.js', 'js/gatherings.js', 'js/scholar.js', 'js/family.js', 'js/audio.js', 'js/events.js', 'js/voice.js', 'js/cities.js', 'js/iman.js', 'js/bayah.js', 'js/meditations.js', 'js/about.js', 'js/install.js', 'install.html',
               'photos/shaykh-1.jpg', 'photos/shaykh-2.jpg', 'photos/shaykh-3.jpg',
               'photos/meditations/khatrat.jpg', 'photos/meditations/good-thoughts.jpg', 'photos/meditations/yaad-faramosh.jpg', 'photos/meditations/change-state.jpg', 'photos/meditations/run-from-it.jpg', 'photos/meditations/imagine-it-leaving.jpg', 'photos/meditations/refuge.jpg', 'photos/meditations/hoon-hoon.jpg', 'photos/meditations/new-creation.jpg', 'photos/meditations/nazar-bar-qadam.jpg', 'photos/meditations/khalwat-dar-anjuman.jpg', 'photos/meditations/guard-the-gaze.jpg', 'photos/meditations/tasawwur-e-shaykh.jpg', 'photos/meditations/one-point.jpg', 'photos/meditations/asl-e-wujood.jpg'];

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
  if (url.pathname.startsWith('/downloads/') || url.pathname.startsWith('/api/') || url.pathname === '/admin.html') return;    // APK, server answers and the admin page always come from the network
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
