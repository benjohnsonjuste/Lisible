// Clés Adsterra "Banner" (display) — ad units "Lisible In-Text <taille>"
// créées le 2026-09-25 dans le dashboard éditeur Adsterra
// (beta.publishers.adsterra.com), site www.lisible.biz (ID 5556396).
//
// Contrainte Adsterra : UNE SEULE "Native Banner" par site (déjà utilisée
// pour le bandeau du haut) → les in-text utilisent le format "Banner".
// Format d'intégration : objet global atOptions + script invoke.js qui fait
// un document.write → chaque bannière est isolée dans une iframe srcDoc
// (sinon le document.write effacerait la page React, et les atOptions
// globaux entreraient en conflit entre eux).
//
// Règle d'or : un code = UN SEUL slot par page (chaque clé n'est utilisée
// qu'une fois, sinon les bannières se marcheraient dessus).

export const ADSTERRA_INVOKE_BASE = "https://www.highrevenueformat.com";

// Mobile : tailles sûres pour un viewport étroit (discret, pas de débordement).
export const INTEXT_MOBILE = [
  { key: "eb9d208147a7b0a64dee236e0a932000", width: 320, height: 50 }, // 320x50
  { key: "4a3b4d7f7692b70cb950f0f6bc4d046f", width: 300, height: 250 }, // 300x250
];

// Desktop : bannières plus larges possibles.
export const INTEXT_DESKTOP = [
  { key: "9d4b8ea21decef12c84008344a719e55", width: 728, height: 90 }, // 728x90
  { key: "bfd649241974036ee3097983a2d7cc69", width: 468, height: 60 }, // 468x60
  { key: "4a3b4d7f7692b70cb950f0f6bc4d046f", width: 300, height: 250 }, // 300x250
];

// Réserve (créées mais non câblées en in-text — format skyscraper,
// inadapté entre des paragraphes ; utilisables pour une future sidebar) :
// 160x600 → 59f8dfd72079a6439c45f3f067a6ef28
// 160x300 → c3be5953aaf4d8cc42cb3d3ae6d2c2ea
