import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { id, action, payload } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID du texte manquant" });
  }

  const textPath = `data/publications/${id}.json`;

  try {
    // 1. Récupérer le contenu actuel du texte sur GitHub
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getRes.ok) throw new Error("Texte introuvable sur le dépôt.");

    const fileData = await getRes.json();
    let textData = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // --- LOGIQUE ACTION : CERTIFICATION ---
    if (action === "certify") {
      const readerEmail = payload?.readerEmail;
      const authorEmail = textData.authorEmail;

      // Incrémenter le compteur de certifications
      textData.totalCertified = (textData.totalCertified || 0) + 1;

      // A. Créditer l'AUTEUR (+1 Li)
      await fetch(`${req.headers.origin}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authorEmail,
          amount: 1,
          reason: `Certification de lecture : ${textData.title}`,
          type: "reward"
        })
      });

      // B. Créditer le LECTEUR (+1 Li) - Sauf si c'est l'auteur lui-même ou un anonyme
      if (readerEmail && readerEmail !== "anonymous@lisible.biz" && readerEmail !== authorEmail) {
        await fetch(`${req.headers.origin}/api/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: readerEmail,
            amount: 1,
            reason: `Récompense lecture : ${textData.title}`,
            type: "reward"
          })
        });
      }
    }

    // --- LOGIQUE ACTIONS : LIKE & VIEW ---
    if (action === "like") {
      textData.totalLikes = (textData.totalLikes || 0) + 1;
    }

    if (action === "view") {
      textData.views = (textData.views || 0) + 1;
    }

    // 2. Sauvegarder les modifications sur GitHub
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `📊 Update ${action} pour : ${textData.title}`,
        content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
        sha: fileData.sha
      })
    });

    if (!putRes.ok) throw new Error("Échec de la mise à jour sur GitHub.");

    return res.status(200).json({ success: true, totalCertified: textData.totalCertified });

  } catch (error) {
    console.error("Erreur API Texts:", error);
    return res.status(500).json({ error: error.message });
  }
}
