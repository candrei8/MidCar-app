const CACHE_NAME = 'midcar-v3';

// Only cache truly static assets - no HTML pages
const STATIC_ASSETS = [
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/manifest.json'
];

// Routes that should NEVER be cached (auth + all protected routes)
const EXCLUDED_ROUTES = [
  '/login',
  '/registro',
  '/register',
  '/logout',
  '/auth',
  '/api/',
  // All protected routes - NEVER cache these
  '/dashboard',
  '/inventario',
  '/contactos',
  '/crm',
  '/seguro',
  '/contratos'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('MidCar PWA: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Check if a URL should be excluded from caching
function shouldExclude(url) {
  return EXCLUDED_ROUTES.some(route => url.pathname.startsWith(route));
}

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip excluded routes (auth pages, API calls)
  if (shouldExclude(url)) return;

  // Skip requests that don't want to follow redirects
  if (event.request.redirect === 'error' || event.request.redirect === 'manual') {
    return;
  }

  event.respondWith(
    fetch(event.request, { redirect: 'follow' })
      .then((response) => {
        // Don't cache redirects, errors, or opaque responses
        if (!response || response.status !== 200 || response.type === 'opaque' || response.redirected) {
          return response;
        }

        // Clone the response before caching
        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });

        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache and offline, return offline page for navigation
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
