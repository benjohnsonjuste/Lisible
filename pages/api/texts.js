// pages/api/texts.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { authorName, title, content, imageBase64 } = req.body;

    // Vérification de sécurité
    if (!authorName || !title || !content) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    // ICI : Vous devriez normalement enregistrer dans une base de données (MongoDB, Prisma, etc.)
    // Pour l'instant, on simule une réussite
    console.log("Données reçues :", { authorName, title, imageBase64: imageBase64 ? "Image présente" : "Pas d'image" });

    return res.status(201).json({ message: "Texte enregistré avec succès" });
  } catch (error) {
    console.error("Erreur API:", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
