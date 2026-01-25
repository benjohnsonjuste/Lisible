import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { id, type, payload } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = `data/publications/${id}.json`;

  try {
    // 1. Récupérer le fichier actuel
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // 2. Appliquer la modification selon le type
    let commitMessage = `📈 Analytics (${type}) : ${id}`;

    if (type === 'view') {
      content.views = (content.views || 0) + 1;
    } 
    else if (type === 'like') {
      content.likesCount = (content.likesCount || 0) + 1;
    } 
    else if (type === 'comment') {
      content.comments = [...(content.comments || []), payload];
    } 
    // --- NOUVELLE LOGIQUE DE MODIFICATION ---
    else if (type === 'update_content') {
      content.title = payload.title;
      content.content = payload.content;
      content.lastUpdated = new Date().toISOString(); // Optionnel : pour savoir quand il a été édité
      commitMessage = `✍️ Édition auteur : ${payload.title} (${id})`;
    }

    // 3. Sauvegarder sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner, 
      repo, 
      path,
      message: commitMessage,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: fileData.sha
    });

    res.status(200).json({ 
      success: true, 
      newValue: type === 'view' ? content.views : null 
    });

  } catch (error) {
    console.error("Erreur API Update:", error);
    res.status(500).json({ error: error.message });
  }
}
