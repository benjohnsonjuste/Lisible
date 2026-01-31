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

  const newNotif = {
    id: `notif-${Date.now()}`,
    type: type || "info",
    message: message || "Nouvelle activité",
    targetEmail: targetEmail || "all",
    link: link || "/dashboard",
    amountLi: amountLi || 0,
    date: new Date().toISOString(),
    read: false
  };

  try {
    // 1. PUSHER : Envoi instantané (pour l'alerte à l'écran)
    await pusher.trigger("global-notifications", "new-alert", newNotif);

    // 2. GITHUB : Archivage pour l'historique
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
    });

    let currentNotifs = [];
    let sha = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      currentNotifs = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
    }

    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 100);

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🔔 Notif pour ${targetEmail}`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha,
      }),
    });

    return res.status(200).json({ success: true, notification: newNotif });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
