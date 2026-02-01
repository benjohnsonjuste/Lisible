import { getFile } from "@/lib/github";
import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  // Génération du nom de fichier attendu (Base64)
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    // 1. On va chercher le profil sur GitHub
    const userFile = await getFile(path);

    if (!userFile) {
      return res.status(404).json({ error: "Utilisateur introuvable. Veuillez vous inscrire." });
    }

    const userData = userFile.content;

    // 2. Vérification du mot de passe (Simple pour l'instant)
    // Idéalement, à l'avenir, utilise bcrypt pour comparer des hashes
    if (userData.password !== password) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // 3. Succès : On retourne les données essentielles (SANS le mot de passe pour la sécurité)
    const { password: _, ...safeUserData } = userData;

    return res.status(200).json({
      success: true,
      user: safeUserData
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Erreur lors de la connexion au serveur." });
  }
}
