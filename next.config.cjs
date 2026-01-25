// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",            // Dossier où seront générés les fichiers PWA
  register: true,            // Enregistre le service worker
  skipWaiting: true,         // Remplace l'ancien service worker automatiquement
  disable: process.env.NODE_ENV === "development", // Désactive PWA en mode dev
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 1. Indispensable pour éviter l'erreur "client-side exception" avec Livepeer
  transpilePackages: ["@livepeer/react", "lucide-react"],
  
  // 2. Autorise l'affichage des flux vidéo et des couvertures GitHub
  images: {
    domains: [
      "raw.githubusercontent.com", 
      "lp-playback.com", 
      "livepeer.studio"
    ],
  },
};

module.exports = withPWA(nextConfig);
