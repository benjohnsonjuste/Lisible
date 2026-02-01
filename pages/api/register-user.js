import { getFile, updateFile } from "@/lib/github";
import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { name, email, password, joinedAt } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Données manquantes pour l'inscription" });
  }

  const cleanEmail = email.toLowerCase().trim();
  // Encodage Base64 cohérent avec login.js et wallet.js
  const fileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    // 1. Vérifier si l'utilisateur existe déjà pour éviter d'écraser un compte
    const existingUser = await getFile(path);
    if (existingUser) {
      return res.status(409).json({ error: "Un compte avec cet email existe déjà." });
    }

    // 2. Structure du nouveau profil (ton modèle complet)
    const newUserProfile = {
      name,
      penName: name,
      email: cleanEmail,
      password, // Note: À hacher plus tard pour la production
      birthday: "",
      joinedAt: joinedAt || new Date().toISOString(),
      profilePic: "",
      role: "author",

      stats: {
        totalTexts: 0,
        totalViews: 0,
        subscribers: 0,
        subscribersList: [],
        totalCertified: 0,
        rank: "Novice"
      },

      wallet: {
        balance: 0,
        totalEarned: 0,
        currency: "Li",
        isMonetized: false,
        canWithdraw: false,
        history: [
          {
            date: new Date().toISOString(),
            type: "system",
            amount: 0,
            label: "Initialisation du compte"
          }
        ]
      },

      prestige: {
        badges: [],
        achievements: {
          hasPublished: false,
          isPartner: cleanEmail === "cmo.lablitteraire7@gmail.com",
          isMecene: false
        }
      }
    };

    // 3. Écriture du fichier sur GitHub via le Helper
    // On passe 'null' pour le SHA car c'est une création de fichier
    const success = await updateFile(
      path, 
      newUserProfile, 
      null, 
      `✨ Nouveau membre : ${name}`
    );

    if (!success) {
      throw new Error("Erreur lors de la sauvegarde sur le serveur de données.");
    }

    // 4. Réponse : On renvoie le profil (sans le mot de passe par sécurité)
    const { password: _, ...safeUser } = newUserProfile;
    return res.status(200).json({ 
      success: true, 
      user: safeUser 
    });

  } catch (error) {
    console.error("Register API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
