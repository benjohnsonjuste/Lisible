import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  const { title, content, authorName, authorEmail, imageBase64, imageName, genre } = req.body;

  if (!title || !content)
    return res.status(400).json({ error: "Titre et contenu requis" });

  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const token = process.env.GITHUB_TOKEN;
  const path = "texts/index.json";

  try {
    // Récupérer l’index existant
    const file = await getFileContent({ owner, repo, path, token });
    const existing = file
      ? JSON.parse(Buffer.from(file.content, "base64").toString("utf8"))
      : [];

    // Créer nouveau texte
    const newText = {
      id: Date.now().toString(),
      title,
      content,
      authorName,
      authorEmail,
      genre: genre || "Poésie",
      image: imageBase64 ? `/texts/images/${imageName}` : null,
      likes: 0,
      views: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    existing.unshift(newText);

    // Mettre à jour le fichier
    await createOrUpdateFile({
      owner,
      repo,
      path,
      content: JSON.stringify(existing, null, 2),
      commitMessage: `✍️ Publier texte : ${title}`,
      token,
    });

    res.status(200).json({ success: true, data: newText });
  } catch (err) {
    console.error("Erreur publication:", err);
    res.status(500).json({ error: err.message });
  }
}