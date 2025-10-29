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

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${uid}.json`;

    const { data: fileData } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      }
    );

    const content = Buffer.from(fileData.content, "base64").toString();
    const userData = JSON.parse(content);

    // Retourner le profil complet, y compris la liste des abonnés
    return res.status(200).json({ success: true, data: userData });
  } catch (err) {
    console.error("Erreur GitHub API:", err);
    return res
      .status(500)
      .json({ error: "Impossible de récupérer les données depuis GitHub" });
  }
}