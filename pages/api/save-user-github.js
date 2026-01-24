import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const userData = req.body;
  
  if (!userData.email) return res.status(400).json({ error: "Email requis" });

  // Création d'un nom de fichier unique basé sur l'email
  const fileName = Buffer.from(userData.email).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    let oldProfile = {};
    let fileSha = null;

    // 1. Tenter de récupérer l'existant sur GitHub
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path
      });
      oldProfile = JSON.parse(Buffer.from(fileData.content, "base64").toString());
      fileSha = fileData.sha;
    } catch (e) {
      console.log("Nouvel utilisateur ou fichier inexistant");
    }

    // 2. Fusion des données (les nouvelles écrasent les anciennes)
    const newProfile = { ...oldProfile, ...userData };

    // 3. Mise à jour ou création du fichier sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `Mise à jour profil : ${userData.email}`,
      content: Buffer.from(JSON.stringify(newProfile, null, 2)).toString("base64"),
      sha: fileSha
    });

    // 4. Envoi de l'email au staff
    try {
      await sendAdminNotification(newProfile);
    } catch (emailErr) {
      console.error("Erreur Email:", emailErr);
      // On ne bloque pas la réponse si seul l'email échoue
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur GitHub API:", error);
    return res.status(500).json({ error: error.message });
  }
}

// --- CONFIGURATION POUR LE BODY (FIXE L'ERREUR 'BODY EXCEEDED') ---
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Autorise jusqu'à 4Mo (pour l'image en base64)
    },
  },
};

async function sendAdminNotification(user) {
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
    subject: `📝 Mise à jour Auteur : ${user.penName || user.name}`,
    html: `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: #14b8a6;">Profil mis à jour</h2>
        <p>L'auteur <b>${user.name}</b> a modifié ses informations.</p>
        <hr border="0" style="border-top: 1px solid #eee;">
        <p><b>Nom de plume :</b> ${user.penName || 'N/A'}</p>
        <p><b>Nom civil :</b> ${user.firstName} ${user.lastName}</p>
        
        <h3 style="color: #0f172a;">Coordonnées de Paiement :</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #14b8a6;">
          <p><b>Méthode :</b> ${user.paymentMethod}</p>
          ${isPaypal 
            ? `<p><b>Email PayPal :</b> ${user.paypalEmail}</p>`
            : `<p><b>Bénéficiaire :</b> ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName}</p>
               <p><b>Pays :</b> ${user.wuMoneyGram?.country} (${user.wuMoneyGram?.areaCode || ''})</p>
               <p><b>Tél :</b> ${user.wuMoneyGram?.phone}</p>`
          }
        </div>
        <p style="font-size: 10px; color: #999; margin-top: 20px;">ID Dossier : ${Buffer.from(user.email).toString('base64').substring(0, 10)}</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
