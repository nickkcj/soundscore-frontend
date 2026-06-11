/*
 * Service worker do SoundScore.
 *
 * O app é altamente dinâmico (feed, chat, sessões em tempo real), então a
 * estratégia é conservadora:
 *  - assets estáticos do Next (/_next/static) e ícones: cache-first
 *    (são imutáveis por hash de build)
 *  - navegações: network-first com fallback para a página offline
 *  - chamadas de API/Supabase: NUNCA interceptadas (sempre rede)
 */
const CACHE = 'soundscore-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          '/icons/icon-192.png',
          '/images/logo_soundscore.png',
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  // API e serviços externos sempre vão direto à rede
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Estáticos imutáveis: cache-first
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Navegações: network-first com fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
      )
    );
  }
});
