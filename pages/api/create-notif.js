import { Buffer } from "buffer";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Non autorisé" });

  const { type, message, targetEmail, link, amountLi } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  // Structure enrichie pour l'économie du Li
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type || "info", // types suggérés : 'li_received', 'certified_read', 'subscription'
    message: message || "Nouvelle activité sur votre compte",
    targetEmail: targetEmail || "all",
    link: link || "/dashboard",
    amountLi: amountLi || 0, // Optionnel : pour afficher "+5 Li" dans la notif
    date: new Date().toISOString()
  };

  try {
    // 1. DÉCLENCHEMENT PUSHER (Temps Réel)
    // On envoie la notification instantanément au client connecté
    try {
      await pusher.trigger("global-notifications", "new-alert", newNotif);
    } catch (e) {
      console.error("Pusher Sync Error:", e);
    }

    // 2. RÉCUPÉRATION DE L'HISTORIQUE SUR GITHUB
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        },
        cache: 'no-store'
    });

    let currentNotifs = [];
    let sha = null;

    if (getRes.status === 200) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      currentNotifs = JSON.parse(content);
    }

    // 3. MISE À JOUR PERMANENTE
    // On limite à 50 pour la performance, mais on place la plus récente en haut
    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        message: `🔔 Notification [${type}] : ${targetEmail}`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha,
      }),
    });

    if (!putRes.ok) throw new Error("Erreur d'écriture GitHub");

    return res.status(200).json({ 
      success: true, 
      message: "Notification propagée et archivée",
      notification: newNotif 
    });

  } catch (error) {
    console.error("Critical Notification Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
