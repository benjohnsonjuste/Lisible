import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Exemple d'API pour sauvegarder un utilisateur sur GitHub (ou un backend).
 * Ici, on simule l'enregistrement en loggant les données reçues.
 * Tu peux remplacer la logique par un appel réel à l'API GitHub ou à ta base.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      uid,
      authorName,
      authorEmail,
      penName,
      birthday,
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      subscribers,
    } = req.body;

    if (!uid || !authorEmail) {
      return res.status(400).json({ error: "uid et email sont requis" });
    }

    // 🔹 Ici tu peux remplacer par un vrai appel à GitHub ou à ta DB
    // Exemple : await fetch("https://api.github.com/...")

    console.log("Nouvel utilisateur enregistré sur GitHub :", {
      uid,
      authorName,
      authorEmail,
      penName,
      birthday,
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      subscribers,
    });

    // Réponse de succès
    return res.status(200).json({ success: true, message: "Utilisateur sauvegardé sur GitHub" });
  } catch (error: any) {
    console.error("Erreur API save-user-github:", error);
    return res.status(500).json({ error: "Erreur interne serveur" });
  }
}