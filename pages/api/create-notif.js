import { Buffer } from "buffer";
import Pusher from "pusher";

// Configuration de Pusher pour le temps réel
const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export default async function handler(req, res) {
  // 1. Sécurité : Uniquement les requêtes POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { type, message, targetEmail, link } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  // Création de l'objet notification
  const newNotif = {
    id: Date.now().toString(),
    type: type || "info",
    message: message,
    targetEmail: targetEmail || "all", // "all" par défaut pour visibilité globale
    link: link || "#",
    date: new Date().toISOString()
  };

  try {
    // --- ÉTAPE 1 : DIFFUSION INSTANTANÉE ---
    // Envoie la notification immédiatement aux clients via Pusher
    await pusher.trigger("global-notifications", "new-alert", newNotif);

    // --- ÉTAPE 2 : RÉCUPÉRATION DE L'HISTORIQUE SUR GITHUB ---
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        },
        cache: 'no-store' // Évite de lire une version cachée
      }
    );

    let currentNotifs = [];
    let sha = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      try {
        currentNotifs = JSON.parse(content);
      } catch (e) {
        currentNotifs = [];
      }
    }

    // On ajoute la nouvelle notif en haut et on limite à 50 messages
    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

    // --- ÉTAPE 3 : MISE À JOUR DU FICHIER SUR GITHUB ---
    // On utilise "await" ici pour s'assurer que l'écriture est terminée avant de répondre
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: `🔔 Notification : ${message.substring(0, 30)}...`,
          content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
          sha: sha, // Obligatoire pour mettre à jour un fichier existant
        }),
      }
    );

    if (!putRes.ok) {
      const errorData = await putRes.json();
      console.error("Erreur GitHub PUT:", errorData);
      throw new Error("Échec de la sauvegarde sur GitHub");
    }

    // Succès total
    return res.status(200).json({ success: true, id: newNotif.id });

  } catch (error) {
    console.error("Erreur critique Notification:", error);
    return res.status(500).json({ 
      error: "Erreur serveur lors du traitement de la notification",
      details: error.message 
    });
  }
}
