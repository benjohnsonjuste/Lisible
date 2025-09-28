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
};

module.exports = withPWA(nextConfig);