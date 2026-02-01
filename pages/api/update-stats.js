// pages/api/update-stats.js
import { createOrUpdateFile } from "@/lib/githubClient";

const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const BRANCH = "main";
const INDEX_PATH = "public/data/texts/index.json";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { textId, views, likes, comments, certifiedReads, authorEmail, senderName } = req.body;
    if (!textId) throw new Error("ID du texte requis");

    const token = process.env.GITHUB_TOKEN;

    // 1. Récupérer l'index actuel
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${INDEX_PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
    );
    
    if (!response.ok) throw new Error("Impossible de récupérer l'index");
    
    const json = await response.json();
    const data = JSON.parse(Buffer.from(json.content, "base64").toString("utf-8"));

    // 2. Trouver le texte pour obtenir son titre (pour la notif)
    const targetText = data.find(t => t.id === textId);
    const updated = data.map((item) =>
      item.id === textId
        ? { 
            ...item, 
            views: views ?? item.views, 
            likes: likes ?? item.likes, 
            comments: comments ?? item.comments,
            certifiedReads: certifiedReads ?? item.certifiedReads 
          }
        : item
    );

    // 3. Écrire sur GitHub (Index des textes)
    await createOrUpdateFile({
      owner: OWNER, repo: REPO, path: INDEX_PATH,
      content: JSON.stringify(updated, null, 2),
      message: `🔁 Stats: ${textId} (Likes/Views/Li)`,
      branch: BRANCH, token, sha: json.sha,
    });

    // 4. SYNCHRONISATION TRANSVERSALE (Si c'est une lecture certifiée ou un like)
    if (authorEmail && (certifiedReads || likes)) {
      // A. Mise à jour du profil auteur (Incrémentation Li / Abonnés)
      await fetch(`${req.headers.origin}/api/update-author-stats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: authorEmail, 
          type: certifiedReads ? 'certified_read' : 'like',
          incrementLi: certifiedReads ? 50 : 0 // On définit 50 Li par lecture
        })
      });

      // B. Envoi de la Notification instantanée
      await fetch(`${req.headers.origin}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: certifiedReads ? 'certified_read' : 'like',
          targetEmail: authorEmail,
          message: certifiedReads 
            ? `✨ Lecture Certifiée sur "${targetText?.title || 'votre texte'}" (+50 Li)`
            : `❤️ ${senderName || "Quelqu'un"} a aimé "${targetText?.title}"`,
          amountLi: certifiedReads ? 50 : 0,
          link: `/bibliotheque` 
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
