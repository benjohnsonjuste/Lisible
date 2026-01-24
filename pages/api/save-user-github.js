import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const userData = req.body;
  
  // Création d'un nom de fichier unique basé sur l'email
  const fileName = Buffer.from(userData.email).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    let oldProfile = {};
    let fileSha = null;

    // 1. Tenter de récupérer le profil existant
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path
      });
      oldProfile = JSON.parse(Buffer.from(fileData.content, "base64").toString());
      fileSha = fileData.sha;
    } catch (e) {
      console.log("Nouvel utilisateur, création du dossier...");
    }

    // 2. Fusionner les données (Profil + Paiement)
    const newProfile = { 
      ...oldProfile, 
      ...userData,
      lastUpdate: new Date().toISOString() 
    };

    // 3. Logique de seuil de monétisation (250 abonnés)
    const reachedThreshold = (
        (!oldProfile.subscribers || oldProfile.subscribers.length < 250) && 
        (newProfile.subscribers && newProfile.subscribers.length >= 250)
    );

    // 4. Mettre à jour GitHub (Crée ou Remplace)
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `🔐 Mise à jour registre auteur : ${newProfile.penName || newProfile.email}`,
      content: Buffer.from(JSON.stringify(newProfile, null, 2)).toString("base64"),
      sha: fileSha // Si null, Octokit comprend que c'est une création
    });

    // 5. Notification au Staff Lisible (Seuil ou Changement de coordonnées bancaires)
    // On envoie un mail si le seuil est atteint OU si c'est une mise à jour de paiement
    if (reachedThreshold || userData.paymentMethod) {
      await sendAdminNotification(newProfile, reachedThreshold);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur API GitHub:", error);
    res.status(500).json({ error: error.message });
  }
}

async function sendAdminNotification(user, isNewActivation) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const subject = isNewActivation 
    ? `🚀 ACTIVATION MONÉTISATION : ${user.penName || user.name}`
    : `💳 MISE À JOUR PAIEMENT : ${user.penName || user.name}`;

  const mailOptions = {
    from: '"Vault Lisible" <no-reply@lisible.com>',
    to: 'cmo.lablitteraire7@gmail.com',
    subject: subject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 30px; text-align: center;">
          <h1 style="color: #2dd4bf; margin: 0; font-size: 24px; font-style: italic;">Lisible Staff Registry</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #0f172a;">${isNewActivation ? 'Nouveau Palier Atteint !' : 'Mise à jour des coordonnées'}</h2>
          <p>L'auteur <strong>${user.name}</strong> (${user.email}) a mis à jour ses informations.</p>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f1f5f9; border-radius: 16px;">
            <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Identité</h3>
            <p><strong>Nom de plume :</strong> ${user.penName || 'Aucun'}</p>
            <p><strong>Nom civil :</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Date de naissance :</strong> ${user.birthday || 'N/A'}</p>
          </div>

          <div style="margin: 20px 0; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
            <h3 style="margin-top: 0; color: #2dd4bf; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Coordonnées de Versement</h3>
            <p><strong>Méthode :</strong> ${user.paymentMethod || 'Non définie'}</p>
            ${user.paymentMethod === 'PayPal' 
              ? `<p style="font-size: 18px; color: #2dd4bf;"><strong>Email :</strong> ${user.paypalEmail}</p>`
              : `
                <p><strong>Destinataire :</strong> ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName}</p>
                <p><strong>Localisation :</strong> ${user.wuMoneyGram?.country} (Zone: ${user.wuMoneyGram?.areaCode})</p>
                <p><strong>Tél :</strong> ${user.wuMoneyGram?.phone}</p>
              `
            }
          </div>

          <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 40px;">
            Document confidentiel — Lisible Studio 2026. <br>
            Toute modification des informations de paiement doit être vérifiée manuellement.
          </p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
