import { getFile, updateFile } from "@/lib/github";
import { Buffer } from "buffer";
// On utilise l'API crypto native de Node.js pour masquer le mot de passe
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { name, email, password, joinedAt } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const fileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const existingUser = await getFile(path);
    if (existingUser) {
      return res.status(409).json({ error: "Un compte avec cet email existe déjà." });
    }

    // --- SÉCURISATION DU MOT DE PASSE ---
    // On crée un "hash" SHA-256 du mot de passe pour qu'il ne soit plus lisible en clair
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const newUserProfile = {
      name,
      penName: name,
      email: cleanEmail,
      password: hashedPassword, // Le mot de passe est maintenant masqué (ex: 5e884898...)
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

    const success = await updateFile(
      path, 
      newUserProfile, 
      null, 
      `✨ Nouveau membre : ${name}`
    );

    if (!success) {
      throw new Error("Erreur lors de la sauvegarde.");
    }

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
