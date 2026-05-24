/**
 * Aentho Dashboard Service Worker
 * Provides offline support, caching strategies, and background sync
 */

const CACHE_NAME = 'aentho-v1';
const RUNTIME_CACHE = 'aentho-runtime-v1';
const DATA_CACHE = 'aentho-data-v1';
const IMAGE_CACHE = 'aentho-images-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Geist:wght@300;400;500;600&display=swap'
];

// Install event: Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== DATA_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Cache-first strategy for images
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('Image not available offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Network-first strategy for external APIs/CDN
  if (url.origin !== new URL(self.location).origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Network request failed', { status: 503 });
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for HTML documents
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center"><div><h1>You\'re Offline</h1><p>The app is cached and will work when you\'re back online.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' }, status: 503 }
          );
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network-first with fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (request.method === 'GET')) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).catch(() => {
          return new Response('Offline - Resource not available', { status: 503 });
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      caches.delete(DATA_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      });
    });
  }
});

// Periodic background sync (for future features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implement data sync when network is available
      Promise.resolve()
    );
  }
});
