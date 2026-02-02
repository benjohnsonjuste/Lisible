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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { type, message, targetEmail, link, amountLi } = req.body;

  if (!targetEmail) {
    return res.status(400).json({ error: "L'email cible est requis" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // Normalisation du nom de fichier identique à login/register/delete
  const emailClean = targetEmail.toLowerCase().trim();
  const userFileId = Buffer.from(emailClean).toString("base64").replace(/=/g, "");
  const path = `data/users/${userFileId}.json`;

  const newNotif = {
    id: `notif-${Date.now()}`,
    type: type || "info",
    message: message || "Nouvelle activité sur votre compte",
    link: link || "/account",
    amountLi: amountLi || 0,
    date: new Date().toISOString(),
    read: false
  };

  try {
    // 1. Déclenchement Pusher pour le temps réel (Frontend)
    // Le canal correspond à l'ID base64 de l'utilisateur
    const channel = `user-${userFileId}`;
    await pusher.trigger(channel, "new-alert", newNotif);

    // 2. Persistance dans GitHub (Stockage historique)
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      // Encodage robuste en utf-8
      let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      
      if (!user.notifications) user.notifications = [];
      
      // Ajout en haut de liste
      user.notifications.unshift(newNotif);
      
      // Limitation pour éviter de faire exploser la taille du fichier JSON sur GitHub
      user.notifications = user.notifications.slice(0, 30); 

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: `🔔 Notification : ${message.substring(0, 30)}...`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return res.status(200).json({ success: true, notifId: newNotif.id });
  } catch (error) {
    console.error("Erreur Notification:", error);
    return res.status(500).json({ error: "Échec de l'envoi de la notification" });
  }
}
