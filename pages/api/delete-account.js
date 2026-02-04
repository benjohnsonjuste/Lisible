import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const emailClean = email.toLowerCase().trim();
  const fileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
  const userPath = `data/users/${fileName}`;

  try {
    // 1. Suppression profil
    const { data: userData } = await octokit.repos.getContent({ owner, repo, path: userPath });
    await octokit.repos.deleteFile({
      owner, repo, path: userPath,
      message: `🗑️ Profil supprimé : ${emailClean}`,
      sha: userData.sha,
    });

    // 2. Nettoyage des textes
    const { data: posts } = await octokit.repos.getContent({ owner, repo, path: "data/publications" });
    const deletePromises = posts.map(async (file) => {
      const { data: fileContent } = await octokit.repos.getContent({ owner, repo, path: file.path });
      const content = JSON.parse(Buffer.from(fileContent.content, 'base64').toString());
      if (content.authorEmail?.toLowerCase() === emailClean) {
        return octokit.repos.deleteFile({
          owner, repo, path: file.path,
          message: `🗑️ Orphelin supprimé : ${file.name}`,
          sha: fileContent.sha
        });
      }
    });
    await Promise.all(deletePromises);

    // AUTOMATISME : Rafraîchir tout le site
    try {
      await res.revalidate('/communaute');
      await res.revalidate('/bibliotheque');
    } catch (e) {}

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du nettoyage" });
  }
}
