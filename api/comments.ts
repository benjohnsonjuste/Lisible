// api/comments.ts
import { NextApiRequest, NextApiResponse } from "next";
import admin from "@/lib/firebaseAdmin"; // ton Firebase Admin

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    // --- Vérification token Firebase ---
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Non autorisé" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    // --- Récupérer le contenu du commentaire ---
    const { textId, content } = req.body;
    if (!textId || !content) {
      return res.status(400).json({ error: "textId et content requis" });
    }

    // Ici tu peux ajouter ton code pour enregistrer le commentaire, par ex. GitHub, DB, etc.
    console.log("Commentaire de", decoded.uid, ":", content);

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Erreur /api/comments:", err);
    res.status(500).json({ error: "Erreur serveur ou token invalide" });
  }
}