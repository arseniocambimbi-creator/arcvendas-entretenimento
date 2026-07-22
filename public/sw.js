// Service worker mínimo — torna a loja instalável (PWA) e dá um fallback
// offline básico para navegações. Não faz cache agressivo do catálogo
// (os dados vêm sempre frescos da API).
const CACHE = 'giftao-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navegações: rede primeiro, com fallback à cache do shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match(req)))
    );
  }
});
