import { Buffer } from "buffer";

const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const INDEX_PATH = "data/publications/index.json"; // Chemin aligné avec votre API de publication

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const token = process.env.GITHUB_TOKEN;

  try {
    const { id, action, authorEmail, senderName } = req.body;
    if (!id) throw new Error("ID de l'œuvre requis");

    // 1. RÉCUPÉRATION DE L'INDEX DEPUIS GITHUB
    const indexFetch = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${INDEX_PATH}?t=${Date.now()}`,
      { headers: { Authorization: `token ${token}` } }
    );
    
    if (!indexFetch.ok) throw new Error("Impossible de joindre l'index global");
    
    const indexData = await indexFetch.json();
    const sha = indexData.sha;
    const content = JSON.parse(Buffer.from(indexData.content, "base64").toString("utf-8"));

    // 2. MISE À JOUR DES STATS DANS LE TABLEAU
    let targetTitle = "votre texte";
    const updatedContent = content.map((item) => {
      if (item.id === id) {
        targetTitle = item.title;
        return {
          ...item,
          views: action === "view" ? (Number(item.views || 0) + 1) : (item.views || 0),
          totalLikes: action === "like" ? (Number(item.totalLikes || item.likes || 0) + 1) : (item.totalLikes || item.likes || 0),
          totalCertified: action === "certify" ? (Number(item.totalCertified || 0) + 1) : (item.totalCertified || 0)
        };
      }
      return item;
    });

    // 3. RENVOI VERS GITHUB (Commit)
    const updateRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${INDEX_PATH}`, {
      method: "PUT",
      headers: { 
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `📊 Stats update: ${action} on ${id}`,
        content: Buffer.from(JSON.stringify(updatedContent, null, 2), "utf-8").toString("base64"),
        sha: sha
      }),
    });

    if (!updateRes.ok) throw new Error("Échec de la sauvegarde des statistiques");

    // 4. LOGIQUE DE RÉCOMPENSE ET NOTIFICATION (Background tasks)
    // On ne bloque pas la réponse principale pour ces appels secondaires
    if (authorEmail && (action === "like" || action === "certify")) {
        const origin = req.headers.origin || `https://${req.headers.host}`;
        
        // A. Mise à jour du profil de l'auteur (Li)
        fetch(`${origin}/api/update-author-stats`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: authorEmail, 
                type: action,
                incrementLi: action === "certify" ? 50 : 0 
            })
        }).catch(e => console.error("Reward error:", e));

        // B. Création de la notification
        fetch(`${origin}/api/create-notif`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: action,
                targetEmail: authorEmail.toLowerCase().trim(),
                message: action === "certify" 
                    ? `✨ Lecture Certifiée sur "${targetTitle}" (+50 Li)`
                    : `❤️ ${senderName || "Quelqu'un"} a aimé "${targetTitle}"`,
                link: `/texts/${id}` 
            })
        }).catch(e => console.error("Notif error:", e));
    }

    return res.status(200).json({ 
        success: true, 
        count: action === "view" ? "updated" : "recorded" 
    });

  } catch (error) {
    console.error("STATS_ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
