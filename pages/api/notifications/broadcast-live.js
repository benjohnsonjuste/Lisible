import Pusher from "pusher";
import { Buffer } from "buffer";

// Initialisation Pusher pour l'historique interne
const pusher = new Pusher({
  appId: "1931362",
  key: "1da55287e2911ceb01dd",
  secret: "f07d3b5b15be62507850",
  cluster: "us2",
  useTLS: true,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { authorName, mode, roomId } = req.body;

  if (!authorName || !roomId) {
    return res.status(400).json({ message: "Données manquantes" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lisible.vercel.app';
  const liveLink = `${baseUrl}/lisible-club?room=${roomId}`;
  const displayMessage = `🔴 ${authorName} est en direct sur Lisible Club !`;

  try {
    // --- 1. ENVOI PUSH (OneSignal) ---
    const oneSignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ["Total Subscriptions"],
        headings: { fr: "DIRECT - Lisible Club" },
        contents: { fr: displayMessage },
        url: liveLink
      })
    });

    // --- 2. ENVOI HISTORIQUE INTERNE (Pusher + GitHub) ---
    // On crée l'objet notif pour l'application
    const newNotif = {
      id: Date.now().toString(),
      type: 'live',
      message: displayMessage,
      targetEmail: "all",
      link: liveLink,
      date: new Date().toISOString()
    };

    // Déclenchement Pusher pour mise à jour instantanée de l'interface
    await pusher.trigger("global-notifications", "new-alert", newNotif);

    // Sauvegarde sur GitHub pour la persistance
    const token = process.env.GITHUB_TOKEN;
    const path = "data/notifications.json";
    
    const getFile = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (getFile.ok) {
      const fileData = await getFile.json();
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const currentNotifs = JSON.parse(content);
      const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

      await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🔴 Live : ${authorName}`,
          content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return res.status(200).json({ success: true, message: "Notifications envoyées" });

  } catch (err) {
    console.error("Erreur Broadcast:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
