import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { reportData } = await req.json();

    // 1. Configurer le transporteur (Utilisez Gmail ou un autre SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Votre email d'envoi (ex: lablitteraire@gmail.com)
        pass: process.env.EMAIL_PASS, // VOTRE MOT DE PASSE D'APPLICATION (16 caractères)
      },
    });

    // 2. Construire le contenu de l'e-mail pour le Staff
    const mailOptions = {
      from: `"Système d'Alerte Lisible" <${process.env.EMAIL_USER}>`,
      to: "cmo.lablitteraire7@gmail.com",
      subject: `🚨 SIGNALEMENT : ${reportData.reason}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 16px; padding: 25px; color: #1e293b;">
          <h2 style="color: #e11d48; margin-top: 0;">Nouveau Signalement</h2>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          
          <p><strong>Texte visé :</strong> <span style="color: #0f172a;">${reportData.textTitle}</span></p>
          <p><strong>Motif :</strong> <span style="background: #fff1f2; color: #e11d48; padding: 4px 10px; border-radius: 6px; font-weight: bold;">${reportData.reason}</span></p>
          <p><strong>Détails :</strong> ${reportData.details || "Aucun détail fourni."}</p>
          
          <div style="margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 12px; font-size: 13px;">
            <p style="margin: 0;"><strong>Signalé par :</strong> ${reportData.reporterEmail}</p>
            <p style="margin: 5px 0 0 0;"><strong>Date :</strong> ${reportData.date}</p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
             <a href="https://lisible.biz/admin/texts/${reportData.textId}" 
                style="background: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
                Vérifier le contenu
             </a>
          </div>
        </div>
      `,
    };

    // 3. Envoyer l'e-mail
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'e-mail" }, { status: 500 });
  }
}
