import { createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      id,
      title,
      content,
      authorName,
      authorEmail,
      imageBase64,
      imageName,
      genre,
    } = req.body;

    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    if (!GITHUB_REPO || !GITHUB_TOKEN) {
      throw new Error("⚠️ GITHUB_REPO et GITHUB_TOKEN sont requis dans les variables d'environnement");
    }

    // ID unique pour le texte
    const fileId = id || `text-${Date.now()}`;
    const fileName = `${fileId}.md`;

    // === Étape 1 : Upload de l’image d’illustration (si fournie) ===
    let uploadedImagePath = null;

    if (imageBase64 && imageName) {
      const imagePath = `data/texts/images/${imageName}`;

      const imageRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${imagePath}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `🖼️ Ajout de l'image ${imageName} pour ${title}`,
          content: imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ""), // Nettoie le prefixe
          branch: GITHUB_BRANCH,
        }),
      });

      if (!imageRes.ok) {
        const errText = await imageRes.text();
        console.error("❌ Erreur upload image:", errText);
        throw new Error("Échec de l’upload de l’image sur GitHub");
      }

      uploadedImagePath = `/data/texts/images/${imageName}`;
    }

    // === Étape 2 : Sauvegarde du texte individuel (Markdown) ===
    const frontMatter = `---
id: ${fileId}
title: "${title}"
author: "${authorName}"
authorEmail: "${authorEmail}"
genre: "${genre || "inconnu"}"
date: "${new Date().toISOString()}"
${uploadedImagePath ? `image: "${uploadedImagePath}"` : ""}
---

${content}
`;

    await createOrUpdateFile({
      path: `data/texts/${fileName}`,
      content: frontMatter,
      commitMessage: id ? `✏️ Mise à jour de ${title}` : `🆕 Ajout de ${title}`,
      branch: GITHUB_BRANCH,
    });

    // === Étape 3 : Mise à jour du fichier index.json ===
    const indexPath = "data/texts/index.json";

    const indexRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${indexPath}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    let indexData = [];
    let indexSha = null;

    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      indexSha = indexJson.sha;
      const decoded = Buffer.from(indexJson.content, "base64").toString();
      indexData = JSON.parse(decoded);
    }

    // Création ou mise à jour de la fiche du texte
    const entry = {
      id: fileId,
      title,
      authorName,
      genre: genre || "inconnu",
      image: uploadedImagePath,
      likes: 0,
      comments: 0,
      date: new Date().toISOString(),
    };

    const existingIndex = indexData.findIndex((t) => t.id === entry.id);
    if (existingIndex !== -1) {
      indexData[existingIndex] = { ...indexData[existingIndex], ...entry };
    } else {
      indexData.push(entry);
    }

    const updatedIndexContent = Buffer.from(JSON.stringify(indexData, null, 2)).toString("base64");

    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${indexPath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `📚 Mise à jour de index.json après publication de ${entry.title}`,
        content: updatedIndexContent,
        sha: indexSha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("❌ Erreur mise à jour index.json:", errText);
      throw new Error("Échec de la mise à jour de index.json");
    }

    // === Étape 4 : Réponse ===
    return res.status(200).json({
      success: true,
      id: fileId,
      message: "✅ Publication réussie sur GitHub",
    });
  } catch (err) {
    console.error("Erreur publication GitHub:", err);
    return res.status(500).json({ error: err.message });
  }
}
