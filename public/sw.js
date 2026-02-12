// public/sw.js

const CACHE_NAME = "lisible-cache-v1";

// URLs adaptées pour Next.js et synchronisées avec le manifest de lisible.biz
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/bibliotheque",
  "/cercle"
];

// Installation du service worker
self.addEventListener("install", (event) => {
  console.log("SW: Installation sur lisible.biz...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Mise en cache des ressources critiques");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  console.log("SW: Activation et prise de contrôle...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("SW: Suppression de l'ancien cache", name);
            return caches.delete(name);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// Stratégie : Stale-while-revalidate (idéal pour le streaming littéraire)
self.addEventListener("fetch", (event) => {
  // On ignore les requêtes API (dynamiques), les méthodes non-GET et les scripts de développement
  if (
    event.request.url.includes('/api/') || 
    event.request.method !== 'GET' ||
    event.request.url.includes('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Si la réponse est valide, on met à jour le cache dynamiquement
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback en cas de mode hors-ligne total
          return cachedResponse;
        });

        // Retourne le cache immédiatement s'il existe, sinon attend le réseau
        return cachedResponse || fetchPromise;
      });
    })
  );
});
