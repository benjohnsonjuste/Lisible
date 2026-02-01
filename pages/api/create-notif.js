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

  // Formatage du chemin utilisateur (Base64)
  const userFileName = Buffer.from(targetEmail.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${userFileName}.json`;

  const newNotif = {
    id: `notif-${Date.now()}`,
    type: type || "info",
    message: message || "Nouvelle activité",
    link: link || "/account",
    amountLi: amountLi || 0,
    date: new Date().toISOString(),
    read: false
  };

  try {
    // 1. Pusher Temps Réel
    const channel = `user-${userFileName}`;
    await pusher.trigger(channel, "new-alert", newNotif);

    // 2. Mise à jour du profil utilisateur pour stocker la notif
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      
      if (!user.notifications) user.notifications = [];
      user.notifications.unshift(newNotif);
      user.notifications = user.notifications.slice(0, 20); // Garder 20 notifs

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🔔 Notif pour ${user.penName}`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
