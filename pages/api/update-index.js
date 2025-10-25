// pages/api/update-index.js
import { createOrUpdateFile, listFilesInRepoDir, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const payload = req.body;

    if (!payload || !payload.id) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const { id, title, genre, authorName, authorEmail, imageBase64, imageName } = payload;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const branch = "main";

    // 1️⃣ Récupérer tous les fichiers textes dans le dossier data/texts
    const files = await listFilesInRepoDir({
      owner,
      repo,
      path: "data/texts",
      branch,
      token,
    });

    // 2️⃣ Créer un tableau de tous les textes
    const texts = [];
    for (const file of files) {
      if (file.type !== "file") continue;
      const contentData = await getFileContent({
        owner,
        repo,
        path: `data/texts/${file.name}`,
        branch,
        token,
      });
      if (!contentData || !contentData.content) continue;

      const jsonContent = Buffer.from(contentData.content, "base64").toString("utf8");
      const text = JSON.parse(jsonContent);

      // Assurer que certaines valeurs existent
      texts.push({
        id: text.id,
        title: text.title,
        genre: text.genre,
        authorName: text.authorName,
        authorEmail: text.authorEmail || "",
        image: text.imageBase64 || null,
        imageName: text.imageName || null,
        likes: text.likes || 0,
        views: text.views || 0,
        comments: text.comments || 0,
        date: text.date || new Date().toISOString(),
      });
    }

    // 3️⃣ Créer ou mettre à jour index.json
    await createOrUpdateFile({
      owner,
      repo,
      path: "data/index.json",
      content: JSON.stringify({ data: texts }, null, 2),
      commitMessage: "🔄 Mise à jour index.json de la bibliothèque",
      branch,
      token,
    });

    return res.status(200).json({ success: true, count: texts.length });
  } catch (err) {
    console.error("update-index error:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}