import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { id, update } = req.body;

    if (!id || !update)
      return res.status(400).json({ error: "ID ou update manquant" });

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = `data/texts/${id}.json`;

    // 1. Télécharger la version actuelle
    const file = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const sha = file.data.sha;
    const content = JSON.parse(
      Buffer.from(file.data.content, "base64").toString()
    );

    // 2. Mise à jour partielle
    const newContent = {
      ...content,
      ...update,
    };

    // 3. Upload vers GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update ${id}.json`,
      content: Buffer.from(JSON.stringify(newContent, null, 2)).toString(
        "base64"
      ),
      sha,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur GitHub" });
  }
}