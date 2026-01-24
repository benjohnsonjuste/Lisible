import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const userData = req.body;
  const fileName = Buffer.from(userData.email).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    // 1. Récupérer l'ancien profil pour comparer
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path
    });

    const oldProfile = JSON.parse(Buffer.from(fileData.content, "base64").toString());
    const newProfile = { ...oldProfile, ...userData };

    // 2. Vérifier si le seuil de monétisation vient d'être franchi
    const reachedThreshold = (oldProfile.subscribers?.length < 250 && newProfile.subscribers?.length >= 250);

    // 3. Mettre à jour GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: `Mise à jour profil : ${newProfile.name}`,
      content: Buffer.from(JSON.stringify(newProfile, null, 2)).toString("base64"),
      sha: fileData.sha
    });

    // 4. SI SEUIL ATTEINT : Envoyer l'email à l'admin
    if (reachedThreshold) {
      await sendAdminNotification(newProfile);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function sendAdminNotification(user) {
  // Configuration du transporteur (Exemple avec Gmail ou autre SMTP)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Ton email d'envoi
      pass: process.env.EMAIL_PASS  // Ton mot de passe d'application
    }
  });

  const mailOptions = {
    from: '"Système Lisible" <no-reply@lisible.com>',
    to: 'cmo.lablitteraire7@gmail.com',
    subject: `🚀 Nouvelle Monétisation Activée : ${user.name}`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 20px;">
        <h2 style="color: #2563eb;">Félicitations ! Un auteur a atteint le seuil.</h2>
        <p>L'auteur <strong>${user.name}</strong> vient d'atteindre 250 abonnés. La monétisation est désormais active.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <h3>Dossier de l'Auteur :</h3>
        <ul>
          <li><strong>Nom complet :</strong> ${user.firstName} ${user.lastName}</li>
          <li><strong>Email :</strong> ${user.email}</li>
          <li><strong>Nom de plume :</strong> ${user.penName || 'N/A'}</li>
          <li><strong>Anniversaire :</strong> ${user.birthday || 'Non renseigné'}</li>
        </ul>

        <h3>Informations de Paiement :</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 10px;">
          <p><strong>Méthode choisie :</strong> ${user.paymentMethod}</p>
          ${user.paymentMethod === 'PayPal' 
            ? `<p><strong>Email PayPal :</strong> ${user.paypalEmail}</p>`
            : `
              <p><strong>Bénéficiaire :</strong> ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName}</p>
              <p><strong>Pays :</strong> ${user.wuMoneyGram?.country}</p>
              <p><strong>Code zone :</strong> ${user.wuMoneyGram?.areaCode}</p>
              <p><strong>Téléphone :</strong> ${user.wuMoneyGram?.phone}</p>
            `
          }
        </div>
        
        <p style="font-size: 12px; color: #999; margin-top: 30px;">Ceci est un message automatique du système Lisible.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}
