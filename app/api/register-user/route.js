import { getFile, updateFile } from "@/lib/github";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    
    // On récupère le referralCode envoyé par le formulaire
    const { name, email, password, joinedAt, referralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const fileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "");
    const path = `data/users/${fileName}.json`;

    // 1. Vérification de l'existence
    const existingUser = await getFile(path);
    if (existingUser) {
      return NextResponse.json({ error: "Un compte avec cet email existe déjà." }, { status: 409 });
    }

    // 2. Hachage du mot de passe
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // 3. Décodage du parrain si présent
    let referrerEmail = null;
    if (referralCode) {
      try { 
        referrerEmail = Buffer.from(referralCode, 'base64').toString('utf-8'); 
      } catch (e) { 
        referrerEmail = null; 
      }
    }

    // 4. Construction du profil complet
    const newUserProfile = {
      name,
      penName: name,
      email: cleanEmail,
      password: hashedPassword,
      birthday: "",
      joinedAt: joinedAt || new Date().toISOString(),
      profilePic: "",
      role: "author",
      referredBy: referrerEmail,

      stats: {
        totalTexts: 0,
        totalViews: 0,
        subscribers: 0,
        subscribersList: [],
        totalCertified: 0,
        rank: "Novice"
      },

      wallet: {
        balance: referralCode ? 200 : 0, 
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

    // 5. Sauvegarde sur GitHub via ta lib standardisée
    const success = await updateFile(
      path, 
      newUserProfile, 
      null, 
      `✨ Nouveau membre ${referralCode ? '(Parrainé)' : ''} : ${name}`
    );

    if (!success) throw new Error("Erreur lors de la sauvegarde.");

    // Sécurité : on retire le mot de passe avant de renvoyer l'objet
    const { password: _, ...safeUser } = newUserProfile;
    
    return NextResponse.json({ success: true, user: safeUser }, { status: 200 });

  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
