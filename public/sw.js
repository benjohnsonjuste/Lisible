// public/sw.js

const CACHE_NAME = "lisible-cache-v1";

// URLs adaptées pour Next.js App Router
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  // Ajoute ici tes routes statiques principales si nécessaire
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("SW: Installation...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Mise en cache des ressources statiques");
      return cache.addAll(urlsToCache);
    })
  );
  // Force le SW sortant à devenir le SW actif
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("SW: Activation et nettoyage...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("SW: Suppression du vieux cache", name);
            return caches.delete(name);
          }
        })
      )
    )
  );
  // Prend le contrôle des pages immédiatement
  return self.clients.claim();
});

// Stratégie : Cache First, fallback to Network
self.addEventListener("fetch", (event) => {
  // On ne met pas en cache les requêtes API (POST, etc.) ni l'admin
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Retourne le cache
      }
      return fetch(event.request).then((networkResponse) => {
        // Optionnel : on pourrait mettre en cache dynamiquement ici
        return networkResponse;
      });
    })
  );
});
