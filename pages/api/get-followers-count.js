import { getFile } from "@/lib/github";
import { Buffer } from "buffer";

export default async function handler(req, res) {
  // Désactiver le cache pour avoir le vrai nombre d'abonnés en temps réel
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const { authorId } = req.query; // authorId peut être un email ou l'ID Base64

    if (!authorId) {
      return res.status(400).json({ error: "ID auteur manquant." });
    }

    // Sécurité : Si l'ID contient un "@", on le transforme en Base64 automatiquement
    let fileName = authorId;
    if (authorId.includes("@")) {
      fileName = Buffer.from(authorId.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    }

    const path = `data/users/${fileName}.json`;
    const userFile = await getFile(path);

    if (!userFile) {
      return res.status(200).json({ followersCount: 0 });
    }

    // On compte soit la longueur du tableau subscribers, soit la valeur numérique
    const subscribers = userFile.content.subscribers;
    const count = Array.isArray(subscribers) ? subscribers.length : (parseInt(subscribers) || 0);
    
    return res.status(200).json({ followersCount: count });

  } catch (error) {
    console.error("Erreur Count:", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
