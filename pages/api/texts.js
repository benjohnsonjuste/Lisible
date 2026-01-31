import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // --- ACTION : CERTIFIER LA LECTURE (Sceau) ---
  if (req.method === "PATCH" && req.body.action === "certify") {
    const { id, payload } = req.body; 
    const readerEmail = payload.readerEmail;

    try {
      // 1. Récupérer le texte
      const textPath = `data/publications/${id}.json`;
      const textRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const textFile = await textRes.json();
      let textData = JSON.parse(Buffer.from(textFile.content, "base64").toString("utf-8"));
      
      // Mise à jour des compteurs certifiés
      textData.totalCertified = (textData.totalCertified || 0) + 1;
      const authorEmail = textData.authorEmail;

      // 2. Créditer l'AUTEUR (+1 Li)
      const authorPath = `data/users/${authorEmail.toLowerCase().trim()}.json`;
      const authRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${authorPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      
      if (authRes.ok) {
        const authFile = await authRes.json();
        let author = JSON.parse(Buffer.from(authFile.content, "base64").toString("utf-8"));
        
        if (!author.wallet) author.wallet = { balance: 0, history: [] };
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

      // 3. Créditer le LECTEUR (+1 Li)
      if (readerEmail && readerEmail !== "anonymous@lisible.biz" && readerEmail !== authorEmail) {
        const readerPath = `data/users/${readerEmail.toLowerCase().trim()}.json`;
        const readRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${readerPath}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
        });
        if (readRes.ok) {
          const readFile = await readRes.json();
          let reader = JSON.parse(Buffer.from(readFile.content, "base64").toString("utf-8"));
          
          if (!reader.wallet) reader.wallet = { balance: 0, history: [] };
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

      // 4. Sauvegarder le TEXTE (Incrémentation certification)
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

  // --- ACTION : LIKE / APPRÉCIATION ---
  if (req.method === "PATCH" && req.body.action === "like") {
    const { id } = req.body;
    const textPath = `data/publications/${id}.json`;

    try {
      const resGet = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      const fileData = await resGet.json();
      let text = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

      text.totalLikes = (text.totalLikes || 0) + 1;

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: "❤️ +1 Appréciation",
          content: Buffer.from(JSON.stringify(text, null, 2)).toString("base64"),
          sha: fileData.sha
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
          message: `💬 Commentaire de ${payload.userName}`,
          content: Buffer.from(JSON.stringify(text, null, 2)).toString("base64"),
          sha: fileData.sha
        })
      });
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  // --- ACTION : PUBLICATION INITIALE (POST) ---
  if (req.method === "POST") {
    const content = req.body; // L'objet complet envoyé par le front (avec isConcours, etc.)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const path = `data/publications/${fileName}.json`;

    // On s'assure que l'ID est bien injecté dans le contenu sauvegardé
    const finalContent = { ...content, id: fileName };

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📝 Publication ${finalContent.isConcours ? '[CONCOURS]' : ''} : ${finalContent.title}`,
          content: Buffer.from(JSON.stringify(finalContent, null, 2)).toString("base64")
        })
      });

      if (response.ok) return res.status(200).json({ success: true, id: fileName });
      throw new Error("Erreur GitHub");
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
}
