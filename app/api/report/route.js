import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { reportData } = await req.json();

    // Configuration du transporteur Gmail
    // IMPORTANT : Utilisez les Variables d'Environnement sur votre hébergeur (Vercel/Netlify)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Votre adresse Gmail d'envoi
        pass: process.env.EMAIL_PASS, // Votre MOT DE PASSE D'APPLICATION (16 caractères)
      },
    });

    const mailOptions = {
      from: `"Alerte Lisible" <${process.env.EMAIL_USER}>`,
      to: "cmo.lablitteraire7@gmail.com",
      subject: `🚨 SIGNALEMENT : ${reportData.reason}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; color: #0f172a;">
          <h2 style="color: #e11d48; font-size: 20px;">Nouveau Signalement reçu</h2>
          <p style="font-size: 14px; color: #64748b;">Un contenu a été marqué pour examen par la modération.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Texte :</strong> ${reportData.textTitle}</p>
            <p style="margin: 0 0 10px 0;"><strong>Motif :</strong> <span style="color: #e11d48;">${reportData.reason}</span></p>
            <p style="margin: 0;"><strong>Détails :</strong> ${reportData.details || "Aucun détail fourni."}</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8;">
            Signaleur : ${reportData.reporterEmail}<br>
            Date : ${reportData.date}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur Mail:", error);
    return NextResponse.json({ error: "Échec de l'envoi" }, { status: 500 });
  }
}
