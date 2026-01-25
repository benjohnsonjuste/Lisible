import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { id, type, payload } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  try {
    // --- PARTIE 1 : MISE À JOUR DU TEXTE ---
    const pathText = `data/publications/${id}.json`;
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: pathText });
    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    let notifMessage = "";
    let targetEmail = content.authorEmail; // Par défaut, l'auteur reçoit la notif

    if (type === 'like') {
      content.likesCount = (content.likesCount || 0) + 1;
      notifMessage = `Quelqu'un a aimé votre texte "${content.title}"`;
    } 
    else if (type === 'comment') {
      content.comments = [...(content.comments || []), payload];
      notifMessage = `${payload.authorName} a commenté votre texte "${content.title}"`;
    }
    else if (type === 'update_content') {
      content.title = payload.title;
      content.content = payload.content;
    }

    // Sauvegarde du texte mis à jour
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path: pathText,
      message: `Update ${type}: ${id}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha: fileData.sha
    });

    // --- PARTIE 2 : GÉNÉRATION DE LA NOTIFICATION ---
    if (notifMessage !== "") {
      const pathNotif = `data/notifications.json`;
      const { data: notifFileData } = await octokit.repos.getContent({ owner, repo, path: pathNotif });
      const notifications = JSON.parse(Buffer.from(notifFileData.content, "base64").toString());

      const newNotif = {
        id: Date.now(),
        type: type,
        message: notifMessage,
        targetEmail: targetEmail, // L'auteur du texte
        link: `/bibliotheque/${id}`,
        date: new Date().toISOString()
      };

      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path: pathNotif,
        message: `🔔 New Notif: ${type}`,
        content: Buffer.from(JSON.stringify([newNotif, ...notifications].slice(0, 50), null, 2)).toString("base64"),
        sha: notifFileData.sha
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
