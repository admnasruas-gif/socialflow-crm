/**
 * SocialFlow PWA Service Worker
 * Permite instalar o SocialFlow como Aplicativo no Celular (Android / iOS / Desktop)
 * Usa estratégia Network-First para sempre buscar dados e código atualizados quando online.
 */

const CACHE_NAME = 'socialflow-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Ignora chamadas de API externas (como Supabase) para nunca cachear dados sensíveis
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        return networkRes;
      })
      .catch(() => caches.match(req))
  );
});
