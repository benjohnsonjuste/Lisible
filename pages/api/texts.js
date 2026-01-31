import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // --- ACTION : CERTIFIER LA LECTURE (Sceau) ---
  if (req.method === "PATCH" && req.body.action === "certify") {
    const { id, payload } = req.body; // id = nom du fichier texte
    const readerEmail = payload.readerEmail;

    try {
      // 1. Récupérer le texte pour augmenter le compteur
      const textPath = `data/publications/${id}.json`;
      const textRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const textFile = await textRes.json();
      let textData = JSON.parse(Buffer.from(textFile.content, "base64").toString("utf-8"));
      
      textData.totalCertified = (textData.totalCertified || 0) + 1;
      const authorEmail = textData.authorEmail;

      // 2. Créditer l'AUTEUR (+1 Li)
      const authorPath = `data/users/${authorEmail.toLowerCase()}.json`;
      const authRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${authorPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      if (authRes.ok) {
        const authFile = await authRes.json();
        let author = JSON.parse(Buffer.from(authFile.content, "base64").toString("utf-8"));
        author.wallet.balance += 1;
        author.wallet.history.unshift({
          date: new Date().toISOString(),
          amount: 1,
          reason: `Lecture certifiée : ${textData.title}`,
          type: "reward"
        });
        
        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${authorPath}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: "📈 +1 Li (Auteur) via Certification",
            content: Buffer.from(JSON.stringify(author, null, 2)).toString("base64"),
            sha: authFile.sha
          })
        });
      }

      // 3. Créditer le LECTEUR (+1 Li) si connecté et différent de l'auteur
      if (readerEmail && readerEmail !== "anonymous@lisible.biz" && readerEmail !== authorEmail) {
        const readerPath = `data/users/${readerEmail.toLowerCase()}.json`;
        const readRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${readerPath}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
        });
        if (readRes.ok) {
          const readFile = await readRes.json();
          let reader = JSON.parse(Buffer.from(readFile.content, "base64").toString("utf-8"));
          reader.wallet.balance += 1;
          reader.wallet.history.unshift({
            date: new Date().toISOString(),
            amount: 1,
            reason: `Lecture récompensée : ${textData.title}`,
            type: "reward"
          });

          await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${readerPath}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              message: "📖 +1 Li (Lecteur) via Certification",
              content: Buffer.from(JSON.stringify(reader, null, 2)).toString("base64"),
              sha: readFile.sha
            })
          });
        }
      }

      // 4. Sauvegarder le nouveau compteur du TEXTE
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: "✅ Incrémentation compteur lecture certifiée",
          content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
          sha: textFile.sha
        })
      });

      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // --- ACTION : COMMENTAIRE ---
  if (req.method === "PATCH" && req.body.action === "comment") {
    const { id, payload } = req.body;
    const textPath = `data/publications/${id}.json`;

    try {
      const resGet = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const fileData = await resGet.json();
      let text = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

      if (!text.comments) text.comments = [];
      text.comments.unshift(payload);

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `💬 Nouveau commentaire de ${payload.userName}`,
          content: Buffer.from(JSON.stringify(text, null, 2)).toString("base64"),
          sha: fileData.sha
        })
      });
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // --- ACTION : PUBLICATION (POST) ---
  if (req.method === "POST") {
    const { fileName, content } = req.body;
    const path = `data/publications/${fileName}.json`;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `📝 Publication : ${fileName}`,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64")
      })
    });
    if (response.ok) return res.status(200).json({ success: true });
    return res.status(500).json({ error: "Erreur GitHub" });
  }
}
