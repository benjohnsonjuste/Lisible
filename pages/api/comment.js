import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const commentData = JSON.parse(req.body); // Si envoyé via body: JSON.stringify
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/commentaires.json",
    });

    const comments = JSON.parse(Buffer.from(fileData.content, "base64").toString());
    
    // On ajoute l'ID unique au commentaire
    const newComment = {
      id: Date.now(),
      ...commentData
    };

    comments.push(newComment);

    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/commentaires.json",
      message: "💬 Nouveau commentaire",
      content: Buffer.from(JSON.stringify(comments, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
