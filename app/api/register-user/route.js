import { getFile, updateFile } from "@/lib/github";
import { Buffer } from "buffer";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // On récupère le referralCode envoyé par le formulaire
  const { name, email, password, joinedAt, referralCode } = req.body;

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

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Décodage du parrain si présent
    let referrerEmail = null;
    if (referralCode) {
      try { referrerEmail = Buffer.from(referralCode, 'base64').toString('utf-8'); } catch (e) { referrerEmail = null; }
    }

    const newUserProfile = {
      name,
      penName: name,
      email: cleanEmail,
      password: hashedPassword,
      birthday: "",
      joinedAt: joinedAt || new Date().toISOString(),
      profilePic: "",
      role: "author",
      referredBy: referrerEmail, // Enregistre l'email du parrain

      stats: {
        totalTexts: 0,
        totalViews: 0,
        subscribers: 0,
        subscribersList: [],
        totalCertified: 0,
        rank: "Novice"
      },

      wallet: {
        balance: referralCode ? 200 : 0, // Bonus de 200 Li si parrainé
        totalEarned: referralCode ? 200 : 0,
        currency: "Li",
        isMonetized: false,
        canWithdraw: false,
        history: [
          {
            date: new Date().toISOString(),
            type: "system",
            amount: referralCode ? 200 : 0,
            label: referralCode ? "Bonus de parrainage (Bienvenue)" : "Initialisation du compte"
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
      `✨ Nouveau membre ${referralCode ? '(Parrainé)' : ''} : ${name}`
    );

    if (!success) throw new Error("Erreur lors de la sauvegarde.");

    const { password: _, ...safeUser } = newUserProfile;
    return res.status(200).json({ success: true, user: safeUser });

  } catch (error) {
    console.error("Register API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
