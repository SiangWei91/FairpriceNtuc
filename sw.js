const CACHE_NAME = 'inventory-pwa-cache-v1';
const urlsToCache = [
  '/', // Alias for index.html
  '/index.html',
  '/product.html',
  '/style.css',
  '/script.js',
  '/manifest.json', // It's good to cache the manifest as well
  // Placeholder for icons, if they were present:
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png'
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event in progress.');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: App shell cached successfully.');
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// Fetch event: serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetching ', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        console.log('Service Worker: Found in cache ', event.request.url);
        return response;
      }

      // Not in cache - fetch from network
      console.log(
        'Service Worker: Not found in cache, fetching from network ',
        event.request.url
      );
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            // Don't cache opaque responses or errors
            return networkResponse;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = networkResponse.clone();

          // Optional: Dynamic caching for non-app shell assets if needed
          // For this task, we are primarily focused on the app shell defined in urlsToCache,
          // which are cached during the install event.
          // However, if new assets were requested that weren't in urlsToCache,
          // you might want to cache them dynamically here.
          // For example:
          // caches.open(CACHE_NAME)
          //   .then(cache => {
          //     cache.put(event.request, responseToCache);
          //   });

          return networkResponse;
        })
        .catch((error) => {
          console.error('Service Worker: Error fetching from network:', error);
          // You could return a custom offline page here if you had one:
          // return caches.match('/offline.html');
          throw error; // Re-throw the error to be handled by the browser
        });
    })
  );
});

// Activate event: clean up old caches (optional for this task, but good practice)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event in progress.');
  const cacheWhitelist = [CACHE_NAME]; // Current cache name
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
