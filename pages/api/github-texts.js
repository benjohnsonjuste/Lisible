// pages/api/github-texts.js
import { getFileContent, listFilesInRepoDir } from "@/lib/githubClient";

export default async function handler(req, res) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return res.status(500).json({ error: "Configuration GitHub manquante" });
    }

    // Lister tous les fichiers JSON dans data/texts/
    const files = await listFilesInRepoDir({
      owner,
      repo,
      path: "data/texts",
      token,
    });

    const texts = [];

    for (const file of files) {
      if (file.type === "file" && file.name.endsWith(".json")) {
        const contentData = await getFileContent({
          owner,
          repo,
          path: `data/texts/${file.name}`,
          token,
        });

        if (contentData && contentData.content) {
          const decoded = Buffer.from(contentData.content, "base64").toString(
            "utf8"
          );
          const json = JSON.parse(decoded);

          texts.push({
            id: json.id,
            title: json.title,
            content: json.content,
            genre: json.genre,
            authorName: json.authorName,
            authorEmail: json.authorEmail,
            image: json.imageBase64 || null,
            imageName: json.imageName || null,
            likes: json.likes || 0,
            views: json.views || 0,
            comments: json.comments || [],
            date: json.date || new Date().toISOString(),
          });
        }
      }
    }

    // Trier les textes par date descendante
    texts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ data: texts });
  } catch (err) {
    console.error("Erreur API github-texts:", err);
    res.status(500).json({ error: "Impossible de récupérer les textes" });
  }
}