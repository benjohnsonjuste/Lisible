import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { type, message, targetEmail, link } = req.body;

  // Configuration GitHub
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  try {
    // 1. Récupérer le fichier actuel
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    let currentNotifs = [];
    let sha = null;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      // Décodage du contenu existant
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      currentNotifs = JSON.parse(content);
    }

    // 2. Créer la nouvelle notification
    const newNotif = {
      id: Date.now().toString(),
      type: type || "info",
      message: message,
      targetEmail: targetEmail || null, // null = public
      link: link || "#",
      date: new Date().toISOString()
    };

    // 3. Ajouter au début de la liste et limiter à 50 notifications pour la performance
    const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 50);

    // 4. Renvoyer le fichier mis à jour vers GitHub
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `🔔 Notification : ${message.substring(0, 30)}...`,
          content: Buffer.from(JSON.stringify(updatedNotifs, null, 2)).toString("base64"),
          sha: sha, // Obligatoire pour mettre à jour un fichier existant
        }),
      }
    );

    if (!putRes.ok) {
      const error = await putRes.json();
      throw new Error(error.message);
    }

    return res.status(200).json({ success: true, notif: newNotif });
  } catch (error) {
    console.error("Erreur API Notification:", error);
    return res.status(500).json({ error: "Impossible de créer la notification" });
  }
}
