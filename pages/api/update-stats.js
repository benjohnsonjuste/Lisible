// pages/api/update-stats.js
import { createOrUpdateFile } from "@/lib/githubClient";

const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const BRANCH = "main";
const INDEX_PATH = "public/data/texts/index.json";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { textId, views, likes, comments } = req.body;
    if (!textId) throw new Error("ID du texte requis");

    const token = process.env.GITHUB_TOKEN;

    // Récupérer le fichier index actuel
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${INDEX_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    const json = await response.json();

    const decoded = Buffer.from(json.content, "base64").toString("utf-8");
    const data = JSON.parse(decoded);

    // Mettre à jour l’entrée correspondante
    const updated = data.map((item) =>
      item.id === textId
        ? { ...item, views, likes, comments }
        : item
    );

    const newContent = JSON.stringify(updated, null, 2);

    // Écrire sur GitHub
    await createOrUpdateFile({
      owner: OWNER,
      repo: REPO,
      path: INDEX_PATH,
      content: newContent,
      message: `🔁 Update stats for text ${textId}`,
      branch: BRANCH,
      token,
      sha: json.sha,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur update-stats:", error);
    return res.status(500).json({ error: error.message });
  }
}