// pages/api/update-author.js
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { authorId, authorName, textId, bio } = req.body;

    // Récupérer le fichier auteur existant
    let authorData = { id: authorId, name: authorName, texts: [], bio: bio || "" };
    try {
      const existingFile = await getFileContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path: `public/data/authors/${authorId}.json`,
        token: process.env.GITHUB_TOKEN,
      });
      authorData = JSON.parse(existingFile);
    } catch (err) {
      // Si le fichier n'existe pas, on part d'un fichier vide
    }

    // Ajouter le nouveau texte si pas déjà présent
    if (!authorData.texts.includes(textId)) {
      authorData.texts.push(textId);
    }

    // Mettre à jour le nom et la bio si nécessaire
    authorData.name = authorName;
    if (bio) authorData.bio = bio;

    // Écrire le fichier sur GitHub
    await createOrUpdateFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: `public/data/authors/${authorId}.json`,
      content: JSON.stringify(authorData, null, 2),
      commitMessage: `✏️ Mise à jour auteur ${authorName}`,
      token: process.env.GITHUB_TOKEN,
    });

    res.status(200).json({ message: "Auteur mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de mettre à jour l'auteur" });
  }
} 