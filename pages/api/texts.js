// pages/api/texts.js

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Augmente la limite pour accepter les images Base64
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { authorName, title, content, imageBase64 } = req.body;

    // Simulation de sauvegarde (Remplace ceci par ta logique de base de données)
    console.log("Nouveau texte reçu :", title);

    return res.status(201).json({ message: "Succès" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du traitement" });
  }
}
