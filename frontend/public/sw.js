/**
 * Loning Maju — Progressive Web App Service Worker (v2.3.0)
 * Strategi Cache:
 * - Static Assets (HTML, JS, CSS, Fonts, Images): Cache-First dengan Network Fallback
 * - API Data (/api/products, /api/umkms): Network-First dengan Cache Fallback untuk offline reading
 */

const CACHE_NAME = 'loning-maju-v2.3.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/branding/logo-loning.svg',
  '/branding/logo-loning.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        /* Abaikan jika sebagian aset belum siap saat install */
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan cache request non-GET (POST, PUT, DELETE) atau request auth terproteksi
  if (request.method !== 'GET' || url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/api/manage') || url.pathname.startsWith('/api/admin')) {
    return;
  }

  // 1. API Data Publik: Network-First, fallback ke Cache saat offline
  if (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/umkms')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: { message: 'Koneksi offline', code: 'OFFLINE' } }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
    );
    return;
  }

  // 2. Navigasi SPA / HTML Pages: Network-First, fallback ke /index.html cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedIndex = await caches.match('/index.html');
        return cachedIndex || caches.match('/');
      }),
    );
    return;
  }

  // 3. Static Assets & Fonts: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    }),
  );
});
