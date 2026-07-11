// Servis radnik — omogućava da app radi i bez interneta (offline) i da se instalira.
// v6: VRAĆENO na "mreža prvo" (network-first) — v5 je greškom bio "keš prvo", zbog čega
// instalirana app na telefonu nije primala nove verzije čak ni kad je sajt u pregledaču bio ažuran.
// Mreža prvo: uvek pokušaj da povučeš najnoviju verziju sa interneta; keš je samo rezerva za offline rad.
const CACHE_NAME = 'proracun-app-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mreža uspela -> koristi svež odgovor i osveži keš za offline rezervu.
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
