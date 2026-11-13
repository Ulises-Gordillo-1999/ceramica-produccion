// Service Worker para CERÁMICA PRODUCCIÓN ERP (Estrategia Network-First con Fallback Offline)
const CACHE_NAME = 'ceramica-prod-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.ico',
];

// 1. Instalación: Cachear cascarón básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activación: Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de Peticiones: Network-First (Priorizar siempre datos en vivo)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // No interceptar peticiones no GET (Server Actions, POST, etc.)
  if (request.method !== 'GET') {
    return;
  }

  // No interceptar recursos de desarrollo o extensiones
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-First para navegación y recursos
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Si la red responde bien, actualizamos la caché con la versión fresca
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Si la red falla (sin señal / corte de Wi-Fi en planta), servir desde caché
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es una navegación HTML y no está en caché, servir la pantalla de login o raíz
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/login') || await caches.match('/');
          if (fallback) return fallback;
        }

        return new Response('Sin conexión a internet en planta.', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
