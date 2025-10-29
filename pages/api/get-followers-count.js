import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const { authorId } = req.query;

  if (!authorId)
    return res.status(400).json({ error: "Paramètre authorId requis" });

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/subscriptions/${authorId}.json`;
    const { data: fileData } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      }
    );

    const existing = JSON.parse(
      Buffer.from(fileData.content, "base64").toString("utf8")
    );

    res.status(200).json({
      followersCount: existing.followers.length || 0,
    });
  } catch (err) {
    // Auteur sans followers = fichier inexistant
    if (err.status === 404)
      return res.status(200).json({ followersCount: 0 });

    console.error("Erreur get-followers-count:", err);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
}