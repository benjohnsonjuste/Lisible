import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "DELETE") { // Changé en DELETE pour respecter les standards
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const emailClean = email.toLowerCase().trim();
  
  // Nom du fichier utilisateur
  const userFileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
  const userPath = `data/users/${userFileName}`;

  try {
    // 1. SUPPRESSION DU PROFIL UTILISATEUR
    const { data: userData } = await octokit.repos.getContent({ owner, repo, path: userPath });
    await octokit.repos.deleteFile({
      owner, repo, path: userPath,
      message: `🗑️ Profil supprimé : ${emailClean}`,
      sha: userData.sha,
    });

    // 2. NETTOYAGE AUTOMATIQUE DES TEXTES (Vitesse & Automatisme)
    // On récupère la liste des textes pour supprimer ceux de cet auteur
    const { data: posts } = await octokit.repos.getContent({ owner, repo, path: "data/posts" });
    
    const deletePromises = posts.map(async (file) => {
      const { data: fileContent } = await octokit.repos.getContent({ owner, repo, path: file.path });
      const content = JSON.parse(Buffer.from(fileContent.content, 'base64').toString());
      
      // Si le texte appartient à l'utilisateur supprimé
      if (content.authorEmail?.toLowerCase() === emailClean) {
        return octokit.repos.deleteFile({
          owner, repo, path: file.path,
          message: `🗑️ Texte orphelin supprimé : ${file.name}`,
          sha: fileContent.sha
        });
      }
    });

    await Promise.all(deletePromises);

    return res.status(200).json({ success: true, message: "Compte et textes nettoyés avec succès" });

  } catch (error) {
    console.error("Erreur suppression:", error);
    if (error.status === 404) return res.status(404).json({ error: "Fichier introuvable" });
    return res.status(500).json({ error: "Erreur serveur lors du nettoyage" });
  }
}
