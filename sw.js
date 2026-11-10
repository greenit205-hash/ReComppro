// WAŻNE: do v8 ten plik serwował WYŁĄCZNIE z cache (`cached || fetch`), więc raz
// zapisana wersja aplikacji zostawała na telefonie na zawsze. Nowa wersja kodu
// docierała tylko wtedy, gdy przeglądarka sama zauważyła zmianę w sw.js — a tego
// nie robiła, bo GitHub Pages podaje ten plik z własnym nagłówkiem cache
// (netlify.toml z `no-cache` działa tylko na Netlify, na Pages jest ignorowany).
// Teraz: najpierw sieć, cache jako zapas offline.
const CACHE_NAME = 'recomppro-v9';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const NET_TIMEOUT_MS = 3500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // cache:'reload' omija cache HTTP przeglądarki — bez tego instalacja
      // nowego service workera potrafi zapisać do cache STARE pliki
      cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pozwala stronie wymusić przejęcie przez nowego workera bez czekania.
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

function fromNetwork(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NET_TIMEOUT_MS);
    fetch(request).then((response) => {
      clearTimeout(timer);
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      resolve(response);
    }).catch((err) => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;                 // POST do Apps Script - nigdy
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;            // obce domeny - przepuszczamy

  // Najpierw sieć; gdy jej nie ma albo odpowiada za wolno - cache.
  event.respondWith(
    fromNetwork(event.request).catch(() =>
      caches.match(event.request).then((cached) =>
        cached || caches.match('./index.html')
      )
    )
  );
});
