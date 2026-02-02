import { getFile, updateFile } from "@/lib/github";
import crypto from "crypto";

export default async function handler(req, res) {
  // Sécurité : Seul toi devrais pouvoir lancer ça
  // Tu peux ajouter une vérification de clé secrète ici si tu veux
  
  try {
    // 1. Lister tous les utilisateurs
    const listRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users`);
    const files = await listRes.json();

    if (!Array.isArray(files)) throw new Error("Impossible de lister les fichiers");

    let updatedCount = 0;

    for (const file of files) {
      if (file.name.endsWith('.json')) {
        // 2. Récupérer le contenu de chaque utilisateur
        const userRes = await fetch(file.download_url);
        const userData = await userRes.json();

        // 3. Vérifier si le mot de passe est déjà haché (un hash SHA-256 fait 64 caractères)
        const isAlreadyHashed = userData.password && userData.password.length === 64 && /^[a-f0-9]+$/.test(userData.password);

        if (!isAlreadyHashed && userData.password) {
          // 4. Hacher le mot de passe en clair
          userData.password = crypto.createHash("sha256").update(userData.password).digest("hex");

          // 5. Sauvegarder la version sécurisée sur GitHub
          // On récupère le SHA actuel du fichier pour la mise à jour
          const currentFile = await getFile(file.path);
          
          await updateFile(
            file.path,
            userData,
            currentFile.sha,
            `🔒 Security: Hashing password for ${userData.penName || userData.email}`
          );
          updatedCount++;
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `${updatedCount} comptes ont été sécurisés.` 
    });

  } catch (error) {
    console.error("Migration Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
