import { getFile } from "@/lib/github";
import { Buffer } from "buffer";
import crypto from "crypto"; // Import indispensable pour la sécurité

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const fileName = Buffer.from(cleanEmail).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const userFile = await getFile(path);

    if (!userFile) {
      return res.status(404).json({ error: "Utilisateur introuvable. Veuillez vous inscrire." });
    }

    const userData = userFile.content;

    // --- VÉRIFICATION SÉCURISÉE ---
    // On hache le mot de passe reçu pour voir s'il correspond au hash enregistré
    const inputHash = crypto.createHash("sha256").update(password).digest("hex");

    // On vérifie si ça match (soit le nouveau format haché, soit l'ancien format pour ne pas bloquer tout le monde d'un coup)
    if (userData.password !== inputHash && userData.password !== password) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // On ne renvoie jamais le mot de passe au client
    const { password: _, ...safeUserData } = userData;

    return res.status(200).json({
      success: true,
      user: safeUserData
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Erreur de connexion au serveur." });
  }
}
