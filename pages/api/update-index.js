// pages/api/update-index.js
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const newText = req.body;
    if (!newText || !newText.id) {
      return res.status(400).json({ error: "Payload invalide" });
    }

    // Récupérer l'index existant sur GitHub
    const indexFile = await getFileContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/texts/index.json",
      branch: "main",
      token: process.env.GITHUB_TOKEN,
    });

    let indexData = [];
    if (indexFile) {
      indexData = JSON.parse(Buffer.from(indexFile.content, "base64").toString("utf8"));
    }

    // Ajouter ou mettre à jour le texte dans l'index
    const existingIndex = indexData.findIndex((t) => t.id === newText.id);
    const textEntry = {
      id: newText.id,
      title: newText.title,
      content: newText.content,
      genre: newText.genre || "Poésie",
      authorName: newText.authorName || "Auteur inconnu",
      authorEmail: newText.authorEmail || "",
      image: newText.imageBase64 || null, // image d'illustration en Base64
      imageName: newText.imageName || null,
      date: newText.date || new Date().toISOString(),
      views: newText.views || 0,
      likes: newText.likes || 0,
      comments: newText.comments || 0,
    };

    if (existingIndex > -1) {
      indexData[existingIndex] = textEntry;
    } else {
      indexData.push(textEntry);
    }

    // Trier par date décroissante
    indexData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Mettre à jour l'index sur GitHub
    await createOrUpdateFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: "data/texts/index.json",
      content: JSON.stringify(indexData, null, 2),
      commitMessage: `📚 Mise à jour index des textes: ${newText.title}`,
      branch: "main",
      token: process.env.GITHUB_TOKEN,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur update-index:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}