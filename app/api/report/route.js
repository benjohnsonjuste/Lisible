import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { reportData } = await req.json();

    // Configuration du transporteur Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // Génération de l'URL du texte (Remplacez par votre domaine réel)
    const baseUrl = "https://lisible.biz"; // Changez ceci par votre URL Vercel si nécessaire
    const textUrl = `${baseUrl}/texts/${reportData.textId}`;

    const mailOptions = {
      from: `"Alerte Lisible" <${process.env.EMAIL_USER}>`,
      to: "cmo.lablitteraire7@gmail.com",
      subject: `🚨 SIGNALEMENT : ${reportData.reason}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; color: #1e293b; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="background: #fff1f2; color: #e11d48; padding: 8px 20px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
              Alerte Modération
            </span>
          </div>
          
          <h2 style="color: #0f172a; font-size: 22px; margin-top: 0; text-align: center;">Nouveau Signalement reçu</h2>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 20px; margin: 30px 0; border: 1px dashed #cbd5e1;">
            <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>Titre :</strong> <span style="color: #334155;">${reportData.textTitle}</span></p>
            <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>Motif :</strong> <span style="color: #e11d48; font-weight: bold;">${reportData.reason}</span></p>
            <p style="margin: 0; font-size: 14px; color: #64748b; font-style: italic;">"${reportData.details || "Aucun commentaire supplémentaire."}"</p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${textUrl}" 
               style="background: #0f172a; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
               EXAMINER LE TEXTE SUR LE SITE
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <div style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
            <p style="margin: 0;"><strong>Signalé par :</strong> ${reportData.reporterEmail}</p>
            <p style="margin: 4px 0 0 0;"><strong>Date :</strong> ${reportData.date}</p>
            <p style="margin: 20px 0 0 0; font-weight: bold; color: #cbd5e1;">Système de sécurité Lisible</p>
          </div>
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
