import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: "Non autorisé" });

  const { fileName } = req.body; // ex: "mon-manuscrit.json"
  if (!fileName) return res.status(400).json({ error: "Fichier requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = `data/publications/${fileName}`;

  try {
    // 1. Récupérer le contenu actuel
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // 2. Incrémenter la lecture certifiée
    content.certifiedReads = (content.certifiedReads || 0) + 1;

    // 3. Renvoyer sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `📈 Certification de lecture : ${fileName}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    res.status(200).json({ success: true, count: content.certifiedReads });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la certification" });
  }
}
