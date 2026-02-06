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
    const textPath = `data/texts/${timestamp}-${slug}.json`;

    const textData = {
      id: timestamp.toString(),
      title,
      content,
      authorName,
      authorEmail,
      createdAt: new Date().toISOString(),
      image: imageName ? `images/${timestamp}-${imageName}` : null,
      views: 0,
      likes: 0,
      comments: [],
    };

    // 1. Commit du texte
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
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

    // 2. Commit de l’image
    if (imageBase64 && imageName) {
      const imagePath = `public/images/${timestamp}-${imageName}`;
      const base64Data = imageBase64.split(",")[1];
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
      });
    }

    // ⚡ AUTOMATISME : Revalidation ISR
    try {
      await res.revalidate('/bibliotheque');
      await res.revalidate('/communaute'); // Pour mettre à jour le compteur de textes de l'auteur
    } catch (err) {
      console.warn("ISR Revalidation failed:", err);
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("GitHub commit error:", error);
    return res.status(500).json({ error: error.message });
  }
}
