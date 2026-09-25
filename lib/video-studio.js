// ---------------------------------------------------------------------------
// Studio Vidéo Lisible — logique pure (testable en Node, sans DOM)
// Transforme un texte en séquence vidéo verticale 1080×1920.
// ---------------------------------------------------------------------------

export const INTRO_DUREE = 2.5; // secondes
export const OUTRO_DUREE = 3.0; // secondes
export const MAX_VERSETS = 60;
export const LARGEUR = 1080;
export const HAUTEUR = 1920;

export const INSTRUMENTALS = [
  { fichier: "aube-douce.mp3", nom: "Aube douce" },
  { fichier: "cocon.mp3", nom: "Cocon" },
  { fichier: "contemplation.mp3", nom: "Contemplation" },
  { fichier: "energie-creative.mp3", nom: "Énergie créative" },
  { fichier: "foret.mp3", nom: "Forêt" },
  { fichier: "inspiration.mp3", nom: "Inspiration" },
  { fichier: "nuit-etoilee.mp3", nom: "Nuit étoilée" },
  { fichier: "ocean-calme.mp3", nom: "Océan calme" },
  { fichier: "plume-legere.mp3", nom: "Plume légère" },
  { fichier: "voyage.mp3", nom: "Voyage" },
];

export const THEMES = {
  nuit: {
    id: "nuit",
    nom: "Nuit dorée",
    description: "Fond nuit profonde, texte ivoire, accents or",
    fondHaut: "#0d1120",
    fondBas: "#05070f",
    texte: "#f5efe0",
    accent: "#d9a441",
    doux: "rgba(245,239,224,0.45)",
  },
  parchemin: {
    id: "parchemin",
    nom: "Parchemin",
    description: "Papier ivoire, encre noire, sceau rouge",
    fondHaut: "#faf7f0",
    fondBas: "#efe7d6",
    texte: "#1c1a17",
    accent: "#9c1f1f",
    doux: "rgba(28,26,23,0.45)",
  },
  bordeaux: {
    id: "bordeaux",
    nom: "Velours bordeaux",
    description: "Fond bordeaux profond, texte rosé, accents or",
    fondHaut: "#2a0d12",
    fondBas: "#120507",
    texte: "#ffe9ec",
    accent: "#e8b34b",
    doux: "rgba(255,233,236,0.45)",
  },
};

// Découpe le contenu en versets (1 ligne non vide = 1 verset), plafonné.
export function decouperVersets(contenu) {
  const lignes = String(contenu || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const tronque = lignes.length > MAX_VERSETS;
  return { versets: lignes.slice(0, MAX_VERSETS), tronque, total: lignes.length };
}

// Construit la séquence : créneaux [debut, fin] de chaque verset + durée totale.
// - mode "voix" : timings = instants (s) où chaque verset a été affiché pendant
//   l'enregistrement (relatifs au début de l'enregistrement) ; dureeVoix = durée
//   totale de l'enregistrement.
// - mode "texte" : dureeParVers uniforme (s).
export function planifierSequence({ versets, mode, timings = [], dureeVoix = 0, dureeParVers = 4 }) {
  const n = versets.length;
  const slots = [];
  if (mode === "voix") {
    for (let i = 0; i < n; i++) {
      const debut = INTRO_DUREE + (timings[i] ?? (i === 0 ? 0 : dureeVoix));
      const fin = INTRO_DUREE + (timings[i + 1] ?? dureeVoix);
      slots.push({ debut, fin: Math.max(fin, debut + 0.8) });
    }
    const dureeTotale = INTRO_DUREE + Math.max(dureeVoix, 1) + OUTRO_DUREE;
    return { slots, dureeTotale };
  }
  const d = Math.max(1.5, Number(dureeParVers) || 4);
  for (let i = 0; i < n; i++) {
    slots.push({ debut: INTRO_DUREE + i * d, fin: INTRO_DUREE + (i + 1) * d });
  }
  return { slots, dureeTotale: INTRO_DUREE + n * d + OUTRO_DUREE };
}

// Index du verset affiché à l'instant t (ou -1).
export function versetCourant(slots, t) {
  for (let i = 0; i < slots.length; i++) {
    if (t >= slots[i].debut && t < slots[i].fin) return i;
  }
  return -1;
}

export function dureeFormatee(secondes) {
  const s = Math.round(secondes);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function urlTexte(textId) {
  return `https://lisible.biz/texts/${textId}`;
}
