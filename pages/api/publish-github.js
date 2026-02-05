import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { title, content, authorName, authorEmail, imageBase64, imageName } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Titre et contenu requis" });
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = "benjohnsonjuste";
    const repo = "Lisible";
    const branch = "main";

    if (!token) throw new Error("GITHUB_TOKEN manquant");

    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const textId = `${timestamp}-${slug}`;
    const textPath = `data/texts/${textId}.json`;

    const textData = {
      id: textId, // Utilisation du slug pour l'ID de redirection
      title,
      content,
      authorName,
      authorEmail,
      createdAt: new Date().toISOString(),
      image: imageName ? `/images/${timestamp}-${imageName}` : null,
      views: 0,
      likes: 0,
      comments: [],
    };

    // 1. Commit du texte complet
    const textCommit = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `📚 Nouveau texte : ${title}`,
        content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
        branch,
      }),
    });

    if (!textCommit.ok) throw new Error("Erreur lors de la sauvegarde du texte sur GitHub");

    // 2. Commit de l’image (Si présente)
    if (imageBase64 && imageName) {
      const imagePath = `public/images/${timestamp}-${imageName}`;
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${imagePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          message: `🖼 Image pour : ${title}`,
          content: base64Data,
          branch,
        }),
      }).catch(e => console.error("Image commit failed:", e));
    }

    // 3. MISE À JOUR DE L'INDEX (Essentiel pour la Bibliothèque)
    const indexPath = "data/publications/index.json";
    const getIndex = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${indexPath}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    let indexData = [];
    let indexSha = null;

    if (getIndex.ok) {
      const indexFile = await getIndex.json();
      indexSha = indexFile.sha;
      indexData = JSON.parse(Buffer.from(indexFile.content, "base64").toString("utf-8"));
    }

    indexData.unshift({
      id: textId,
      title,
      authorName,
      authorEmail,
      date: textData.createdAt,
      hasImage: !!imageBase64
    });

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${indexPath}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: "🗂 Update Index",
        content: Buffer.from(JSON.stringify(indexData.slice(0, 1000), null, 2)).toString("base64"),
        sha: indexSha,
        branch
      }),
    });

    // ⚡ Revalidation ISR
    try {
      await res.revalidate('/bibliotheque');
      await res.revalidate('/communaute');
    } catch (err) {}

    // Retourner l'ID pour que le Front puisse rediriger
    return res.status(201).json({ success: true, id: textId });

  } catch (error) {
    console.error("GitHub commit error:", error);
    return res.status(500).json({ error: error.message });
  }
}
