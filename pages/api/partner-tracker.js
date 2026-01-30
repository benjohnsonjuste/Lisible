import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: "Non autorisé" });

  const { partnerId, action } = req.body; // action: 'view' ou 'click'
  if (!partnerId) return res.status(400).json({ error: "ID Partenaire requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/marketing/partners.json";

  try {
    // 1. Récupérer les stats actuelles
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // 2. Mettre à jour les stats du partenaire spécifique
    if (!content[partnerId]) {
      content[partnerId] = { views: 0, clicks: 0 };
    }

    if (action === 'view') content[partnerId].views += 1;
    if (action === 'click') content[partnerId].clicks += 1;

    // 3. Sauvegarder sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `📈 Stat Marketing [${action}] : Partenaire ${partnerId}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur tracking" });
  }
}
