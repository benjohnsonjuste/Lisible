import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({ error: "UID manquant" });
    }

    // 🔐 Initialisation de GitHub API
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${uid}.json`;

    try {
      // 📦 Lecture du fichier utilisateur sur GitHub
      const { data: fileData } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });

      // Décoder le contenu Base64
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      const userData = JSON.parse(content);

      return res.status(200).json({ success: true, data: userData });
    } catch (err) {
      // Fichier non trouvé
      if (err.status === 404) {
        return res.status(404).json({ error: "Utilisateur non trouvé sur GitHub" });
      }
      throw err;
    }
  } catch (err) {
    console.error("Erreur GitHub API:", err);
    return res.status(500).json({ error: "Impossible de récupérer les données utilisateur" });
  }
}