import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { id, textId, imageName, imageBase64, authorName, authorEmail } = req.body;

  if (!imageBase64 || !imageName) {
    return res.status(400).json({ error: "Image manquante" });
  }

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = "main";
    const token = process.env.GITHUB_TOKEN;

    // 🔹 1. Enregistrer l’image dans /data/images/
    const imagePath = `data/images/${imageName}`;
    const base64Content = imageBase64.split(",")[1]; // Retirer le préfixe data:image/png;base64,

    await createOrUpdateFile({
      owner,
      repo,
      path: imagePath,
      content: base64Content,
      commitMessage: `🖼️ Ajout de l'image : ${imageName}`,
      token,
      branch,
      isBase64: true, // indique que c’est une image encodée
    });

    // 🔹 2. Charger index.json existant (ou créer un tableau vide)
    let indexData = [];
    try {
      const existing = await getFileContent({ owner, repo, path: "data/images/index.json", branch, token });
      indexData = JSON.parse(existing.content);
    } catch {
      indexData = [];
    }

    // 🔹 3. Créer l’URL publique GitHub
    const imageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imagePath}`;

    // 🔹 4. Ajouter ou remplacer l’entrée
    const newEntry = {
      id,
      textId,
      imageName,
      imageUrl,
      authorName,
      authorEmail,
      date: new Date().toISOString(),
    };

    const existingIndex = indexData.findIndex((img) => img.id === id);
    if (existingIndex !== -1) {
      indexData[existingIndex] = newEntry;
    } else {
      indexData.push(newEntry);
    }

    // 🔹 5. Mettre à jour index.json
    await createOrUpdateFile({
      owner,
      repo,
      path: "data/images/index.json",
      content: JSON.stringify(indexData, null, 2),
      commitMessage: `🗂️ Mise à jour index des images`,
      token,
      branch,
    });

    return res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    console.error("Erreur update-images-index:", error);
    return res.status(500).json({ error: error.message });
  }
}