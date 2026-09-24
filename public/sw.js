// AceMatric Service Worker — Push Notifications + Offline Content Caching

const CACHE_NAME = 'acematric-v1';
const STATIC_CACHE = 'acematric-static-v1';
const CONTENT_CACHE = 'acematric-content-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== CONTENT_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests — network only (with offline fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation — network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Content pages — stale while revalidate
  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      caches.open(CONTENT_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Images — cache first with network fallback
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CONTENT_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'AceMatric';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.url || '/',
      vibrate: [200, 100, 200],
      tag: data.tag || 'acematric-notification',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[SW] Push error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
