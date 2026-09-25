// Catalogue des instrumentals du Podcast Duo (généré).
export const INSTRUMENTALS = [
  {
    "id": "aube-douce",
    "nom": "Aube douce",
    "ambiance": "Calme et lumineux",
    "fichier": "/audio/instrumentals/aube-douce.mp3",
    "duree": 24
  },
  {
    "id": "nuit-etoilee",
    "nom": "Nuit étoilée",
    "ambiance": "Rêveur et profond",
    "fichier": "/audio/instrumentals/nuit-etoilee.mp3",
    "duree": 24
  },
  {
    "id": "inspiration",
    "nom": "Inspiration",
    "ambiance": "Positif et ouvert",
    "fichier": "/audio/instrumentals/inspiration.mp3",
    "duree": 24
  },
  {
    "id": "plume-legere",
    "nom": "Plume légère",
    "ambiance": "Léger et aérien",
    "fichier": "/audio/instrumentals/plume-legere.mp3",
    "duree": 24
  },
  {
    "id": "contemplation",
    "nom": "Contemplation",
    "ambiance": "Profond et méditatif",
    "fichier": "/audio/instrumentals/contemplation.mp3",
    "duree": 24
  },
  {
    "id": "energie-creative",
    "nom": "Énergie créative",
    "ambiance": "Rythmé et motivant",
    "fichier": "/audio/instrumentals/energie-creative.mp3",
    "duree": 24
  },
  {
    "id": "ocean-calme",
    "nom": "Océan calme",
    "ambiance": "Fluide et apaisant",
    "fichier": "/audio/instrumentals/ocean-calme.mp3",
    "duree": 24
  },
  {
    "id": "foret",
    "nom": "Forêt",
    "ambiance": "Organique et naturel",
    "fichier": "/audio/instrumentals/foret.mp3",
    "duree": 24
  },
  {
    "id": "voyage",
    "nom": "Voyage",
    "ambiance": "Cinématique et ample",
    "fichier": "/audio/instrumentals/voyage.mp3",
    "duree": 24
  },
  {
    "id": "cocon",
    "nom": "Cocon",
    "ambiance": "Chaleureux et intime",
    "fichier": "/audio/instrumentals/cocon.mp3",
    "duree": 24
  }
];

export function instrumentalById(id) {
  return INSTRUMENTALS.find((i) => i.id === id) || null;
}
