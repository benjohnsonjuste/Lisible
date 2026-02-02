import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email requis pour la suppression" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  // Recréation du nom de fichier exact (trim et lowercase pour la précision)
  const emailClean = email.toLowerCase().trim();
  const fileName = Buffer.from(emailClean).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer le SHA du fichier (obligatoire pour supprimer sur GitHub)
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    // 2. Supprimer le fichier
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `🗑️ Suppression définitive du compte : ${emailClean}`,
      sha: fileData.sha,
    });

    return res.status(200).json({ success: true, message: "Compte supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression GitHub:", error);
    
    if (error.status === 404) {
      return res.status(404).json({ error: "Utilisateur non trouvé sur le serveur" });
    }
    
    return res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
  }
}
