import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const userData = req.body;
  
  if (!userData.email) return res.status(400).json({ error: "Email requis" });

  // Utilisation de l'email direct (minuscule) pour le nom du fichier
  const fileName = `${userData.email.toLowerCase().trim()}.json`;
  const path = `data/users/${fileName}`;

  try {
    let oldProfile = {};
    let fileSha = null;

    // 1. Tenter de récupérer le profil existant sur GitHub
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path
      });
      
      // Décodage UTF-8 sécurisé
      const content = Buffer.from(fileData.content, "base64").toString("utf-8");
      oldProfile = JSON.parse(content);
      fileSha = fileData.sha;
    } catch (e) {
      console.log("Nouveau profil : création du fichier.");
    }

    // 2. FUSION SÉCURISÉE DES DONNÉES
    // On priorise userData pour le nom/photo, mais on protège les abonnés de oldProfile
    const newProfile = { 
      ...oldProfile, // Garde tout ce qui existe déjà (dont subscribers)
      ...userData,   // Écrase avec les nouvelles saisies de l'utilisateur
      // Garantie que subscribers reste un tableau et n'est pas écrasé par du vide
      subscribers: oldProfile.subscribers || userData.subscribers || [],
      lastUpdate: new Date().toISOString() 
    };

    // 3. ENCODAGE ET SAUVEGARDE SUR GITHUB
    // Utilisation de Buffer pour un encodage propre des caractères spéciaux
    const jsonString = JSON.stringify(newProfile, null, 2);
    const contentPayload = Buffer.from(jsonString, "utf-8").toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `Mise à jour profil : ${userData.penName || userData.email}`,
      content: contentPayload,
      sha: fileSha
    });

    // 4. NOTIFICATION AU STAFF
    try {
      await sendAdminNotification(newProfile);
    } catch (emailErr) {
      console.error("Erreur Notification Email:", emailErr);
    }

    return res.status(200).json({ success: true, profile: newProfile });

  } catch (error) {
    console.error("Erreur GitHub API:", error);
    return res.status(500).json({ error: "Échec de la synchronisation avec le registre." });
  }
}

// Configuration pour autoriser les photos de profil (Base64)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

async function sendAdminNotification(user) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const isPaypal = user.paymentMethod === 'PayPal';

  const mailOptions = {
    from: '"Lisible Vault" <no-reply@lisible.com>',
    to: 'cmo.lablitteraire7@gmail.com',
    subject: `📝 Mise à jour Profil : ${user.penName || user.name}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 15px;">
        <h2 style="color: #14b8a6;">Profil Auteur Mis à Jour</h2>
        <p>L'auteur <b>${user.name || 'Inconnu'}</b> a modifié ses informations.</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p><b>Nom de plume :</b> ${user.penName || 'Non défini'}</p>
        <p><b>Abonnés actuels :</b> ${user.subscribers?.length || 0}</p>
        
        <h3 style="color: #0f172a;">Mode de paiement :</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #14b8a6;">
          <p><b>Méthode :</b> ${user.paymentMethod}</p>
          ${isPaypal 
            ? `<p><b>Email PayPal :</b> ${user.paypalEmail}</p>`
            : `<p><b>Bénéficiaire :</b> ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName}</p>
               <p><b>Pays :</b> ${user.wuMoneyGram?.country}</p>`
          }
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
