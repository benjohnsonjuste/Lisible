// app/api/notify-staff/route.js
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userEmail, penName, paymentData } = body;

    if (!userEmail || !paymentData) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    const details = paymentData.paymentMethod === "PayPal" 
      ? `<b>Email PayPal :</b> ${paymentData.paypalEmail}`
      : `<b>Western Union :</b> ${paymentData.wuFirstName} ${paymentData.wuLastName} (${paymentData.wuCountry})`;

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Staff Notification Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
