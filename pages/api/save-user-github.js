import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const userData = req.body;
  
  if (!userData.email) return res.status(400).json({ error: "Email requis" });

  // --- CORRECTION DU CHEMIN ---
  // On utilise l'email direct pour correspondre aux appels du catalogue
  const fileName = `${userData.email.toLowerCase()}.json`;
  const path = `data/users/${fileName}`;

  try {
    let oldProfile = {};
    let fileSha = null;

    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path
      });
      // Décodage UTF-8 pour supporter les accents dans les noms de plume
      oldProfile = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      fileSha = fileData.sha;
    } catch (e) {
      console.log("Nouveau profil créé");
    }

    // Fusion : on garde les abonnés existants s'ils ne sont pas dans req.body
    const newProfile = { 
      subscribers: [], // Valeur par défaut
      ...oldProfile, 
      ...userData,
      lastUpdate: new Date().toISOString() 
    };

    // Sauvegarde avec encodage UTF-8 sécurisé
    const contentPayload = btoa(unescape(encodeURIComponent(JSON.stringify(newProfile, null, 2))));

    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `Mise à jour profil : ${userData.penName || userData.email}`,
      content: contentPayload,
      sha: fileSha
    });

    // Notification Email
    try {
      await sendAdminNotification(newProfile);
    } catch (emailErr) {
      console.error("Erreur Email Notification");
    }

    return res.status(200).json({ success: true, profile: newProfile });
  } catch (error) {
    console.error("Erreur GitHub API:", error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement sur le serveur" });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

async function sendAdminNotification(user) {
  // ... (Ton code nodemailer reste identique)
  // Assure-toi juste d'utiliser user.penName dans le texte de l'email
}
