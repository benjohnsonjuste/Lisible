import { createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id, title, content, authorName, authorEmail, imageBase64, imageName } = req.body;

    const fileId = id || `text-${Date.now()}`;
    const fileName = `${fileId}.md`;
    const imageFront = imageBase64 ? `image: "${imageBase64}"\nimageName: "${imageName}"\n` : "";

    const mdContent = `---
id: ${fileId}
title: "${title}"
author: "${authorName}"
authorEmail: "${authorEmail}"
date: "${new Date().toISOString()}"
${imageFront}
---

${content}`;

    await createOrUpdateFile({
      path: `data/texts/${fileName}`,
      content: mdContent,
      commitMessage: id ? `Update ${title}` : `Add ${title}`,
      branch: process.env.GITHUB_BRANCH || "main",
    });

    return res.status(200).json({ success: true, id: fileId });
  } catch (err) {
    console.error("publish-github error", err);
    return res.status(500).json({ error: err.message });
  }
}