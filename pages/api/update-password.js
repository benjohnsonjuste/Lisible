import { Octokit } from "@octokit/rest";
import crypto from "crypto"; // Crucial pour la mise à jour sécurisée

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const fileName = Buffer.from(email.toLowerCase().trim()).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    const response = await octokit.repos.getContent({ owner, repo, path });
    const fileData = response.data;
    const userContent = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    // --- VÉRIFICATION SÉCURISÉE (Hash) ---
    const currentInputHash = crypto.createHash("sha256").update(currentPassword).digest("hex");
    
    // On accepte le hash OU l'ancien mot de passe (si pas encore migré)
    if (userContent.password !== currentInputHash && userContent.password !== currentPassword) {
      return res.status(401).json({ error: "L'ancien mot de passe est incorrect" });
    }

    // --- NOUVEAU HASH ---
    const newHashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");

    const updatedUser = {
      ...userContent,
      password: newHashedPassword, // On enregistre le hash, pas le texte clair !
      updatedAt: new Date().toISOString()
    };

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `🔐 Sécurité : Mise à jour mot de passe haché [${email}]`,
      content: Buffer.from(JSON.stringify(updatedUser, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    return res.status(200).json({ success: true, message: "Mot de passe sécurisé et modifié !" });

  } catch (error) {
    return res.status(500).json({ error: "Serveur indisponible" });
  }
}
