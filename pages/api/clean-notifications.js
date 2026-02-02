import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  const userFileId = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${userFileId}.json`;

  try {
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getRes.ok) return res.status(404).json({ error: "Profil introuvable" });

    const fileData = await getRes.json();
    let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    if (!user.notifications) return res.status(200).json({ message: "Rien à nettoyer" });

    // Filtrage : On garde les notifs de moins de 30 jours
    const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;
    const maintenant = Date.now();

    const initialCount = user.notifications.length;
    user.notifications = user.notifications.filter(notif => {
      const estAncienne = (maintenant - new Date(notif.date).getTime()) > TRENTE_JOURS_MS;
      return !estAncienne; // On ne garde que les récentes
    });

    if (user.notifications.length !== initialCount) {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "🧹 Nettoyage auto des notifications",
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: fileData.sha,
        }),
      });
    }

    return res.status(200).json({ success: true, supprimees: initialCount - user.notifications.length });
  } catch (error) {
    return res.status(500).json({ error: "Erreur cleanup" });
  }
}
