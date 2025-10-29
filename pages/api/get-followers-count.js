import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "ID auteur manquant." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${authorId}.json`;
    let followersCount = 0;

    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });

      const content = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8")
      );

      followersCount = content.subscribers ? content.subscribers.length : 0;
    } catch (err) {
      followersCount = 0; // si le fichier n'existe pas encore
    }

    return res.status(200).json({ followersCount });
  } catch (error) {
    console.error("Erreur /api/get-followers-count :", error);
    return res.status(500).json({ error: "Erreur lors du comptage des abonnés." });
  }
}