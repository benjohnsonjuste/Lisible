import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { id, action, payload } = req.body;
  if (!id) return res.status(400).json({ error: "ID du texte manquant" });

  const textPath = `data/publications/${id}.json`;

  try {
    // 1. Récupérer le texte sur GitHub
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getRes.ok) throw new Error("Texte introuvable.");

    const fileData = await getRes.json();
    let textData = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
    const origin = req.headers.origin || `https://${req.headers.host}`;

    // --- LOGIQUE ACTIONS ---

    if (action === "certify") {
      const readerEmail = payload?.readerEmail;
      textData.totalCertified = (textData.totalCertified || 0) + 1;

      // Créditer l'AUTEUR
      await fetch(`${origin}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: textData.authorEmail,
          amount: 1,
          reason: `Certification : ${textData.title}`,
          type: "reward"
        })
      });

      // Notifier l'auteur
      await fetch(`${origin}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: textData.authorEmail,
          type: "certified_read",
          message: `Nouveau sceau apposé sur "${textData.title}" !`,
          amountLi: 1
        })
      });

      // Créditer le LECTEUR (si identifié et différent de l'auteur)
      if (readerEmail && readerEmail !== "anonymous@lisible.biz" && readerEmail !== textData.authorEmail) {
        await fetch(`${origin}/api/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: readerEmail, amount: 1, reason: `Lecture certifiée : ${textData.title}`, type: "reward" })
        });
      }
    }

    if (action === "like") {
      textData.totalLikes = (textData.totalLikes || 0) + 1;
      // Notifier l'auteur du like
      await fetch(`${origin}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: textData.authorEmail,
          type: "like",
          message: `Quelqu'un apprécie votre texte "${textData.title}"`
        })
      });
    }

    if (action === "view") {
      textData.views = (textData.views || 0) + 1;
    }

    if (action === "comment") {
      if (!textData.comments) textData.comments = [];
      const newComment = {
        userName: payload.userName || "Une plume",
        text: payload.text,
        date: new Date().toISOString()
      };
      textData.comments.push(newComment);

      // Notifier l'auteur du commentaire
      await fetch(`${origin}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: textData.authorEmail,
          type: "comment",
          message: `${newComment.userName} a commenté votre texte.`,
          link: `/text/${id}`
        })
      });
    }

    // 2. Sauvegarder sur GitHub
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `📊 Stats update [${action}] : ${textData.title}`,
        content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
        sha: fileData.sha
      })
    });

    if (!putRes.ok) throw new Error("Erreur GitHub Write");

    return res.status(200).json({ 
      success: true, 
      totalCertified: textData.totalCertified,
      totalLikes: textData.totalLikes,
      comments: textData.comments 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
