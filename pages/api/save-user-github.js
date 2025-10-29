import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const userData = req.body;

    if (!userData?.uid) {
      return res.status(400).json({ error: "UID manquant" });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${userData.uid}.json`;

    let sha;
    // Vérifier si le fichier existe déjà
    try {
      const { data } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });
      sha = data.sha;
    } catch {
      sha = undefined; // fichier inexistant → création
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `Mise à jour profil ${userData.firstName || userData.uid}`,
      content: Buffer.from(JSON.stringify(userData, null, 2)).toString("base64"),
      sha,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur save-user-github :", err);
    return res.status(500).json({ error: err.message });
  }
}