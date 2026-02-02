import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, currentPassword, newPassword } = req.body;

  // Validation des champs
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  // Génération du nom de fichier identique à l'inscription (Base64 propre)
  const fileName = Buffer.from(email.toLowerCase().trim())
    .toString('base64')
    .replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupération du fichier utilisateur actuel
    let fileData;
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      fileData = response.data;
    } catch (e) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    const userContent = JSON.parse(
      Buffer.from(fileData.content, "base64").toString("utf-8")
    );

    // 2. Vérification de sécurité (Ancien mot de passe)
    if (userContent.password !== currentPassword) {
      return res.status(401).json({ error: "L'ancien mot de passe est incorrect" });
    }

    // 3. Préparation des données mises à jour
    const updatedUser = {
      ...userContent,
      password: newPassword,
      updatedAt: new Date().toISOString()
    };

    // 4. Envoi de la mise à jour vers GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `🔐 Sécurité : Mise à jour mot de passe [${email}]`,
      content: Buffer.from(JSON.stringify(updatedUser, null, 2)).toString("base64"),
      sha: fileData.sha, // Indispensable pour l'écrasement
    });

    return res.status(200).json({ 
      success: true, 
      message: "Mot de passe modifié avec succès" 
    });

  } catch (error) {
    console.error("Erreur Update Password:", error);
    return res.status(500).json({ 
      error: "Le serveur de sécurité est momentanément indisponible" 
    });
  }
}
