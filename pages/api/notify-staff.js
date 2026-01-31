import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userEmail, penName, paymentData } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const details = paymentData.paymentMethod === "PayPal" 
    ? `<b>Email PayPal :</b> ${paymentData.paypalEmail}`
    : `<b>Western Union :</b> ${paymentData.wuFirstName} ${paymentData.wuLastName} (${paymentData.wuCountry})`;

  try {
    await transporter.sendMail({
      from: '"Lisible System" <system@lisible.biz>',
      to: 'cmo.lablitteraire7@gmail.com',
      subject: `🔄 MISE À JOUR FINANCIÈRE : ${penName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #14b8a6;">Mise à jour des coordonnées de paiement</h2>
          <p>L'auteur <b>${penName}</b> (${userEmail}) a mis à jour ses informations de versement.</p>
          <hr>
          <p><b>Méthode choisie :</b> ${paymentData.paymentMethod}</p>
          <p>${details}</p>
          <hr>
          <p style="font-size: 10px; color: #999;">Date de synchronisation : ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
