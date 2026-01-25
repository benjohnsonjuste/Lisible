// Service Worker minimal pour valider l'installation PWA
const CACHE_NAME = 'lisible-v1';

self.addEventListener('install', (event) => {
  console.log('SW: Installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activé');
});

self.addEventListener('fetch', (event) => {
  // Nécessaire pour que le navigateur considère le site comme installable
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
