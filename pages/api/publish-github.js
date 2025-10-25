// pages/api/publish-github.js
import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { title, content, authorName, authorEmail, imageBase64, imageName, genre } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    // --- 1️⃣ Créer un identifiant unique pour le texte ---
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const date = new Date().toISOString();

    // --- 2️⃣ Préparer le contenu du texte ---
    const textData = {
      id,
      title,
      content,
      authorName: authorName || "Auteur inconnu",
      authorEmail: authorEmail || "",
      genre: genre || "Poésie",
      image: imageName ? `/data/images/${imageName}` : null,
      date,
      likes: 0,
      views: 0,
      comments: 0,
    };

    // --- 3️⃣ Enregistrer le texte dans public/data/texts/{id}.json ---
    await createOrUpdateFile({
      owner: OWNER,
      repo: REPO,
      path: `public/data/texts/${id}.json`,
      content: JSON.stringify(textData, null, 2),
      commitMessage: `Ajout du texte : ${title}`,
      branch: BRANCH,
      token: TOKEN,
    });

    // --- 4️⃣ Enregistrer l’image si présente ---
    if (imageBase64 && imageName) {
      const base64Data = imageBase64.split(",")[1]; // retire le préfixe data:image/...
      await createOrUpdateFile({
        owner: OWNER,
        repo: REPO,
        path: `public/data/images/${imageName}`,
        content: base64Data,
        commitMessage: `Ajout de l'image : ${imageName}`,
        branch: BRANCH,
        token: TOKEN,
        isBase64: true,
      });
    }

    // --- 5️⃣ Mettre à jour index.json ---
    const indexFile = await getFileContent({
      owner: OWNER,
      repo: REPO,
      path: `public/data/texts/index.json`,
      branch: BRANCH,
      token: TOKEN,
    });

    let indexData = [];
    let sha = null;
    if (indexFile) {
      indexData = JSON.parse(Buffer.from(indexFile.content, "base64").toString("utf-8"));
      sha = indexFile.sha;
    }

    indexData.push(textData);

    await createOrUpdateFile({
      owner: OWNER,
      repo: REPO,
      path: `public/data/texts/index.json`,
      content: JSON.stringify(indexData, null, 2),
      commitMessage: `Mise à jour index.json avec le texte : ${title}`,
      branch: BRANCH,
      token: TOKEN,
    });

    return res.status(200).json({ message: "Texte publié avec succès !", textData });
  } catch (err) {
    console.error("publish-github error:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}