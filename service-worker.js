// Nom du cache (tu peux le changer à chaque mise à jour)
const CACHE_NAME = "mon-app-cache-v1";

// Liste des fichiers à mettre en cache
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker : Installation en cours...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker : Fichiers mis en cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker : Activation");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("Service Worker : Ancien cache supprimé", name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Interception des requêtes réseau
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si le fichier est dans le cache → le servir
      if (response) {
        return response;
      }
      // Sinon → aller le chercher sur le réseau
      return fetch(event.request);
    })
  );
});