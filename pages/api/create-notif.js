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

  const { type, message, targetEmail, link } = req.body;
  
  // Variables d'environnement à vérifier sur votre dashboard Vercel
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  const newNotif = {
    id: Date.now().toString(),
    type: type || "info",
    message: message,
    targetEmail: targetEmail || "all",
    link: link || "#",
    date: new Date().toISOString()
  };

  try {
    // ÉTAPE 1 : PUSHER (Temps réel immédiat)
    // On utilise "global-notifications" et "new-alert"
    await pusher.trigger("global-notifications", "new-alert", newNotif);

    // ÉTAPE 2 : GITHUB (Persistance pour l'historique)
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

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🔔 Notification : ${message.substring(0, 30)}`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha,
      }),
    });

    if (!putRes.ok) throw new Error("Erreur lors de l'écriture sur GitHub");

    return res.status(200).json({ success: true, pushed: true, saved: true });

  } catch (error) {
    console.error("ERREUR NOTIF:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
