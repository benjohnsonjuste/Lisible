// pages/api/publish-github.js
import { createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      id,
      title,
      content,
      authorName,
      authorEmail,
      imageBase64,
      imageName,
    } = req.body;

    if (!title || !content)
      return res.status(400).json({ error: "Titre et contenu requis" });

    const fileId = id || `text-${Date.now()}`;
    const fileName = `${fileId}.md`;

    // Encode proprement l'image pour éviter les retours à la ligne
    const cleanImage = imageBase64 ? imageBase64.replace(/\r?\n/g, "") : null;
    const imageFront = cleanImage
      ? `image: "${cleanImage}"\nimageName: "${imageName}"\n`
      : "";

    const mdContent = `---
id: ${fileId}
title: "${title}"
author: "${authorName}"
authorEmail: "${authorEmail}"
date: "${new Date().toISOString()}"
${imageFront}
---

${content}`;

    // ⚠️ Ajouter owner et repo pour GitHub
    await createOrUpdateFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: `data/texts/${fileName}`,
      content: mdContent,
      commitMessage: id ? `Update ${title}` : `Add ${title}`,
      branch: process.env.GITHUB_BRANCH || "main",
      token: process.env.GITHUB_TOKEN,
    });

    return res.status(200).json({ success: true, id: fileId });
  } catch (err) {
    console.error("publish-github error", err);
    return res.status(500).json({ error: err.message });
  }
}