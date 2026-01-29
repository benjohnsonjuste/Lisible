import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  
  // Génération du nom de fichier (Base64 de l'email)
  const fileName = Buffer.from(email.toLowerCase()).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer les données actuelles de l'utilisateur
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    const userContent = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // 2. Vérification de l'ancien mot de passe
    if (userContent.password !== currentPassword) {
      return res.status(401).json({ error: "L'ancien mot de passe est incorrect" });
    }

    // 3. Mise à jour de l'objet utilisateur
    const updatedUser = {
      ...userContent,
      password: newPassword, // Mise à jour avec le nouveau
      lastPasswordChange: new Date().toISOString()
    };

    // 4. Renvoi vers GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Sécurité : Changement de mot de passe pour ${email}`,
      content: Buffer.from(JSON.stringify(updatedUser, null, 2)).toString("base64"),
      sha: fileData.sha, // Nécessaire pour mettre à jour un fichier existant
    });

    return res.status(200).json({ success: true, message: "Mot de passe mis à jour" });

  } catch (error) {
    console.error("Erreur Update Password:", error);
    return res.status(500).json({ error: "Erreur lors de la communication avec le serveur" });
  }
}
