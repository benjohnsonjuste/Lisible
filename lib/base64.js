// lib/base64.js

export function toBase64(str) {
  if (typeof window === "undefined") {
    // Côté serveur Node.js
    return Buffer.from(str).toString("base64");
  } else {
    // Côté client navigateur
    return btoa(unescape(encodeURIComponent(str)));
  }
}