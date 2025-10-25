// pages/api/upload-image.js
import { createOrUpdateFile } from "@/lib/githubClient";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb", // Limite taille image
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { imageBase64, imageName } = req.body;

    if (!imageBase64 || !imageName) {
      return res.status(400).json({ error: "Image ou nom manquant" });
    }

    const id = Date.now().toString();
    const path = `data/images/${id}-${imageName}`;

    // Créer le fichier sur GitHub
    await createOrUpdateFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      content: imageBase64.replace(/^data:image\/\w+;base64,/, ""), // Supprimer le préfixe data:image
      commitMessage: `🖼️ Publication image: ${imageName}`,
      branch: "main",
      token: process.env.GITHUB_TOKEN,
    });

    res.status(200).json({ success: true, path });
  } catch (err) {
    console.error("Erreur upload-image:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'upload" });
  }
}