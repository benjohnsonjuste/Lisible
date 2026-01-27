import { Buffer } from "buffer";
import Pusher from "pusher";

// Initialisation de Pusher pour l'envoi instantané
const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Non autorisé" });

  const { type, message, targetEmail, link } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  const newNotif = {
    id: Date.now().toString(),
    type: type || "info",
    message: message,
    targetEmail: targetEmail || null,
    link: link || "#",
    date: new Date().toISOString()
  };

  try {
    // --- ÉTAPE 1 : ENVOI INSTANTANÉ (C'est ça qui répare le retard) ---
    // On envoie la notification sur un canal global "notifications"
    await pusher.trigger("global-notifications", "new-alert", newNotif);

    // --- ÉTAPE 2 : SAUVEGARDE GITHUB (En arrière-plan pour l'historique) ---
    // On répond au client immédiatement pour ne pas le faire attendre GitHub
    res.status(200).json({ success: true, sent: true });

    // Le code continue de s'exécuter pour GitHub
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    let currentNotifs = [];
    let sha = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      currentNotifs = JSON.parse(content);
    }

    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🔔 Notif : ${message.substring(0, 30)}`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha,
      }),
    });

  } catch (error) {
    console.error("Erreur Notification:", error);
    if (!res.writableEnded) res.status(500).json({ error: "Erreur" });
  }
}
