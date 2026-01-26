import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = "benjohnsonjuste";
const repo = "Lisible";
const path = "data/textes.json";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "ID manquant" });

  try {
    // 1. Récupérer le contenu actuel
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // 2. Mise à jour de la vue
    const updatedContent = content.map((t) => {
      if (String(t.id).trim() === String(id).trim()) {
        return { ...t, views: (Number(t.views) || 0) + 1 };
      }
      return t;
    });

    // 3. Commit sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `📈 Vue +1 sur le texte ${id}`,
      content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur API Views:", error);
    return res.status(500).json({ error: "Erreur lors de l'incrémentation" });
  }
}
