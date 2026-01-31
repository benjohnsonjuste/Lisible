import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { name, email, password, joinedAt } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Nettoyage de l'email
  const cleanEmail = email.toLowerCase().trim();
  
  // Nom du fichier : email en base64
  const fileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "") + ".json";

  // --- STRUCTURE DE DONNÉES UNIFIÉE ---
  const newUserProfile = {
    // Identité
    name,
    penName: name, // Par défaut le nom de plume est le nom d'inscription
    email: cleanEmail,
    password, 
    joinedAt: joinedAt || new Date().toISOString(),
    profilePic: "",
    role: "author",

    // Système de Statistiques (Initialisé à zéro)
    stats: {
      totalTexts: 0,
      totalViews: 0,
      subscribers: 0, // Nombre d'abonnés (integer pour calculs rapides)
      subscribersList: [], // Liste des emails des abonnés
      totalCertified: 0, // Lectures Li reçues
      rank: "Novice"
    },

    // Système Économique (Trésorerie)
    wallet: {
      balance: 0, // Solde actuel en Li
      totalEarned: 0, // Gains cumulés historiques
      currency: "Li",
      isMonetized: false, // Devient true à 250 abonnés
      canWithdraw: false, // Devient true si balance >= 25000
      history: [
        {
          date: joinedAt || new Date().toISOString(),
          type: "system",
          amount: 0,
          label: "Création du compte Lisible"
        }
      ]
    },

    // Système de Prestige (Badges & Succès)
    prestige: {
      badges: [], // Sera calculé à la volée ou stocké ici
      achievements: {
        hasPublished: false,
        isPartner: cleanEmail === "cmo.lablitteraire7@gmail.com",
        isMecene: false
      }
    },

    // Paramètres
    settings: {
      notifications: true,
      privacy: "public"
    }
  };

  try {
    // Vérification si l'utilisateur existe déjà pour éviter l'écrasement accidentel
    try {
      await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: `data/users/${fileName}`,
      });
      return res.status(400).json({ error: "Cet utilisateur existe déjà dans le registre." });
    } catch (e) {
      // Si erreur, c'est que le fichier n'existe pas, on continue l'inscription
    }

    // Création du fichier sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: `data/users/${fileName}`,
      message: `✨ Inscription automatique : ${name} (${cleanEmail})`,
      content: Buffer.from(JSON.stringify(newUserProfile, null, 2)).toString("base64"),
    });

    return res.status(200).json({ 
      success: true, 
      message: "Profil initialisé avec succès.",
      user: newUserProfile 
    });

  } catch (error) {
    console.error("GitHub API Error:", error);
    return res.status(500).json({ error: "Erreur lors de l'écriture dans le registre : " + error.message });
  }
}
