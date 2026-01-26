import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = "benjohnsonjuste";
const repo = "Lisible";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Méthode non autorisée" });

  const { textId, userName, userEmail, text, date } = req.body;

  if (!textId || !text) {
    return res.status(400).json({ message: "Données textId ou text manquantes" });
  }

  try {
    // 1. AJOUT DU COMMENTAIRE DANS data/commentaires.json
    const commPath = "data/commentaires.json";
    const { data: commFile } = await octokit.repos.getContent({ owner, repo, path: commPath });
    const allComments = JSON.parse(Buffer.from(commFile.content, "base64").toString());

    const newCommentEntry = { 
      textId: String(textId), 
      userName: userName || "Lecteur Lisible", 
      userEmail: userEmail || "", 
      text, 
      date: date || new Date().toISOString() 
    };
    
    allComments.push(newCommentEntry);

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: commPath,
      message: `💬 Nouveau commentaire sur le texte ${textId}`,
      content: Buffer.from(JSON.stringify(allComments, null, 2)).toString("base64"),
      sha: commFile.sha,
    });

    // 2. MISE À JOUR DU COMPTEUR (commentsCount) DANS data/textes.json
    const textPath = "data/textes.json";
    const { data: textFile } = await octokit.repos.getContent({ owner, repo, path: textPath });
    const allTexts = JSON.parse(Buffer.from(textFile.content, "base64").toString());

    const updatedTexts = allTexts.map((t) => {
      if (String(t.id).trim() === String(textId).trim()) {
        return { ...t, commentsCount: (Number(t.commentsCount) || 0) + 1 };
      }
      return t;
    });

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: textPath,
      message: `🔢 Incrément compteur commentaires pour ${textId}`,
      content: Buffer.from(JSON.stringify(updatedTexts, null, 2)).toString("base64"),
      sha: textFile.sha,
    });

    return res.status(200).json({ success: true, comment: newCommentEntry });
  } catch (error) {
    console.error("Erreur API Comment:", error);
    return res.status(500).json({ error: "Erreur lors de la publication du commentaire" });
  }
}
