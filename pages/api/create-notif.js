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
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  // Création d'une structure de données solide
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID unique garanti
    type: type || "info",
    message: message || "Nouvelle notification",
    targetEmail: targetEmail || "all",
    link: link || "/lisible-club", // Lien par défaut vers le club
    date: new Date().toISOString()
  };

  try {
    // 1. DÉCLENCHEMENT PUSHER (Instantanéité)
    // On utilise un try/catch spécifique pour Pusher afin qu'un bug Pusher ne bloque pas l'écriture GitHub
    try {
      await pusher.trigger("global-notifications", "new-alert", newNotif);
    } catch (e) {
      console.error("Pusher Error:", e);
    }

    // 2. RÉCUPÉRATION GITHUB (Lecture)
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

    // 3. MISE À JOUR (Écriture)
    // On garde les 50 dernières notifications pour éviter que le fichier devienne trop lourd
    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        message: `🔔 Notification : ${message.substring(0, 30)}...`,
        content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
        sha: sha, // Requis par GitHub pour prouver qu'on a lu la dernière version
      }),
    });

    if (!putRes.ok) {
      const errorData = await putRes.json();
      throw new Error(`GitHub API error: ${errorData.message}`);
    }

    return res.status(200).json({ success: true, notification: newNotif });

  } catch (error) {
    console.error("Critical API Error:", error);
    return res.status(500).json({ error: "Échec de la création de la notification", details: error.message });
  }
}
