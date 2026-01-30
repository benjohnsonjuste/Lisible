import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/marketing/partners_config.json";

  if (req.method === 'GET') {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      const content = JSON.parse(Buffer.from(data.content, "base64").toString());
      return res.status(200).json(content);
    } catch (e) { return res.status(200).json({ ads: [], lastUpdate: null }); }
  }

  if (req.method === 'POST') {
    const { ads, adminUser } = req.body;
    
    // Création de l'objet complet avec métadonnées
    const newConfig = {
      ads: ads,
      _metadata: {
        lastUpdate: new Date().toISOString(),
        updatedBy: adminUser
      }
    };

    try {
      let sha;
      try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        sha = data.sha;
      } catch (e) { sha = null; }

      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path,
        message: `⚙️ Ads Update by ${adminUser}`,
        content: Buffer.from(JSON.stringify(newConfig, null, 2)).toString("base64"),
        sha
      });
      return res.status(200).json({ success: true });
    } catch (e) { return res.status(500).json({ error: "Erreur de sauvegarde" }); }
  }
}
