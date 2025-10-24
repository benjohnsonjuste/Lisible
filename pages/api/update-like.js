// pages/api/update-like.js
import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // ex: "username/repo"
const BRANCH = process.env.GITHUB_BRANCH || "main";
const INDEX_PATH = "data/texts/index.json";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { textId, likes } = req.body;
    if (!textId || likes == null) {
      return res.status(400).json({ error: "Missing textId or likes" });
    }

    // 1️⃣ Récupérer le fichier index.json depuis GitHub
    const indexRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${INDEX_PATH}?ref=${BRANCH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!indexRes.ok) {
      const err = await indexRes.json();
      throw new Error(err.message || "Impossible de récupérer index.json");
    }

    const indexJson = await indexRes.json();
    const decoded = Buffer.from(indexJson.content, "base64").toString();
    let indexData = JSON.parse(decoded);
    const sha = indexJson.sha;

    // 2️⃣ Mettre à jour le compteur de likes pour le texte concerné
    const textIndex = indexData.findIndex((t) => t.id === textId);
    if (textIndex === -1) {
      return res.status(404).json({ error: "Texte non trouvé dans index.json" });
    }

    indexData[textIndex].likes = likes;

    // 3️⃣ Encoder et envoyer le fichier mis à jour vers GitHub
    const updatedContent = Buffer.from(JSON.stringify(indexData, null, 2)).toString("base64");

    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${INDEX_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `👍 Mise à jour des likes pour ${indexData[textIndex].title}`,
        content: updatedContent,
        sha,
        branch: BRANCH,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || "Erreur lors de la mise à jour de index.json");
    }

    res.status(200).json({ success: true, likes });
  } catch (err) {
    console.error("update-like error:", err);
    res.status(500).json({ error: err.message });
  }
}