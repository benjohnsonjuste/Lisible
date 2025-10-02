// sw.js - Service Worker pour la PWA Lisible

const CACHE_NAME = "lisible-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.json",
  "/styles/globals.css",
  "/_next/static/*",
  "/logo192.png",
  "/logo512.png",
];

// Installer le service worker et mettre en cache les ressources essentielles
self.addEventListener("install", (event) => {
  console.log("[SW] Installation en cours...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Mise en cache des ressources...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activer le service worker et supprimer les anciens caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation en cours...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepter les requêtes réseau et répondre avec le cache si disponible
self.addEventListener("fetch", (event) => {
  const { request } = event;
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retourner la ressource en cache
        return cachedResponse;
      }
      // Sinon, récupérer depuis le réseau et mettre en cache
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Optionnel : retour d'une page offline
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});

// Gérer la mise à jour du service worker et notifier les clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});