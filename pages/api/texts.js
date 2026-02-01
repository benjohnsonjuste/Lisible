import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // Fonction utilitaire pour obtenir le chemin du fichier utilisateur (Base64)
  const getUserPath = (email) => {
    const encoded = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    return `data/users/${encoded}.json`;
  };

  if (req.method === "PATCH" && req.body.action === "certify") {
    const { id, payload } = req.body; 
    const readerEmail = payload.readerEmail;

    try {
      const textPath = `data/publications/${id}.json`;
      const textRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const textFile = await textRes.json();
      let textData = JSON.parse(Buffer.from(textFile.content, "base64").toString("utf-8"));
      
      textData.totalCertified = (textData.totalCertified || 0) + 1;
      const authorEmail = textData.authorEmail;

      // 1. Créditer l'AUTEUR (+1 Li) via l'API Wallet pour plus de sécurité
      await fetch(`${req.headers.origin}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authorEmail,
          amount: 1,
          reason: `Certification : ${textData.title}`
        })
      });

      // 2. Créditer le LECTEUR (+1 Li)
      if (readerEmail && readerEmail !== "anonymous@lisible.biz" && readerEmail !== authorEmail) {
        await fetch(`${req.headers.origin}/api/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: readerEmail,
            amount: 1,
            reason: `Récompense Lecture : ${textData.title}`
          })
        });
      }

      // 3. Sauvegarder le texte mis à jour
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: "✅ Certification validée",
          content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
          sha: textFile.sha
        })
      });

      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // --- ACTIONS : LIKE & VIEW ---
  if (req.method === "PATCH" && (req.body.action === "like" || req.body.action === "view")) {
    const { id, action } = req.body;
    const textPath = `data/publications/${id}.json`;
    try {
      const resGet = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const fileData = await resGet.json();
      let text = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      
      if (action === "like") text.totalLikes = (text.totalLikes || 0) + 1;
      if (action === "view") text.views = (text.views || 0) + 1;

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `📊 Update ${action}`,
          content: Buffer.from(JSON.stringify(text, null, 2)).toString("base64"),
          sha: fileData.sha
        })
      });
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
}
