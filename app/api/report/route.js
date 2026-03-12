import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function POST(req) {
  try {
    const { reportData } = await req.json();
    const isForum = reportData.reason === "FORUM_POST";
    const isDirectMessage = reportData.reason === "DIRECT_MESSAGE";
    const isPodcast = reportData.reason === "PODCAST_ISSUE" || (reportData.textId && reportData.textId.startsWith("POD-"));
    // Détection si c'est un message venant du Studio
    const isStudioContact = reportData.textId === "STUDIO-CONTACT";

    // 1. SI C'EST UN MESSAGE FORUM, ON LE SAUVEGARDE SUR GITHUB
    if (isForum) {
      const msgId = reportData.textId.replace("FORUM-", "");
      const filePath = `data/forum/messages/${msgId}.json`;
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

      const messageContent = {
        id: parseInt(msgId),
        author: reportData.textTitle.replace("Nouveau message de ", ""),
        email: reportData.reporterEmail,
        text: reportData.details,
        date: new Date().toISOString()
      };

      await fetch(url, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: `Forum: ${messageContent.author}`,
          content: btoa(JSON.stringify(messageContent, null, 2))
        })
      });
    }

    // 2. CONFIGURATION DU TRANSPORTEUR GMAIL
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // Détermination du destinataire et de l'URL de redirection
    const recipientEmail = isDirectMessage ? reportData.targetEmail : "cmo.lablitteraire7@gmail.com";
    const baseUrl = "https://lisible.biz";
    
    let redirectUrl = `${baseUrl}/texts/${reportData.textId}`;
    if (isPodcast) redirectUrl = `${baseUrl}/auditorium/${reportData.textId}`;
    if (isForum) redirectUrl = `${baseUrl}/forum`;
    if (isDirectMessage) redirectUrl = `${baseUrl}/community?openChat=${encodeURIComponent(reportData.reporterEmail)}`;
    // Si c'est un contact studio, on utilise l'URL contenue dans les détails ou le studio par défaut
    if (isStudioContact) redirectUrl = `${baseUrl}/studio`;

    const mailOptions = {
      from: `"Messagerie Lisible" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: isDirectMessage ? `✉️ Nouveau message de ${reportData.textTitle}` : isForum ? `💬 FORUM : Nouveau message` : `🚨 SIGNALEMENT : ${reportData.reason}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; color: #1e293b; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="background: ${isDirectMessage ? '#eff6ff' : isForum ? '#f0fdf4' : '#fff1f2'}; color: ${isDirectMessage ? '#2563eb' : isForum ? '#16a34a' : '#e11d48'}; padding: 8px 20px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
              ${isDirectMessage ? 'Message Privé' : isForum ? 'Nouvelle Discussion' : isStudioContact ? 'Assistance Studio' : 'Alerte Modération'}
            </span>
          </div>
          
          <h2 style="color: #0f172a; font-size: 22px; margin-top: 0; text-align: center;">
            ${isDirectMessage ? reportData.textTitle + ' vous a écrit' : isForum ? 'Un nouveau message est en ligne' : 'Nouveau Signalement / Requête'}
          </h2>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 20px; margin: 30px 0; border: 1px dashed #cbd5e1; border-left: 4px solid ${isDirectMessage ? '#2563eb' : isStudioContact ? '#e11d48' : 'transparent'};">
            <p style="margin: 0 0 12px 0; font-size: 15px;"><strong>${isDirectMessage ? 'Expéditeur' : 'Auteur'} :</strong> <span style="color: #334155;">${reportData.textTitle}</span></p>
            ${(!isForum && !isDirectMessage) ? `<p style="margin: 0 0 12px 0; font-size: 15px;"><strong>Objet :</strong> <span style="color: #e11d48; font-weight: bold;">${reportData.reason}</span></p>` : ''}
            <div style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6; white-space: pre-wrap;">${reportData.details || "Aucun contenu."}</div>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${redirectUrl}" 
               style="background: #0f172a; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
               ${isDirectMessage ? 'RÉPONDRE SUR LISIBLE' : isForum ? 'VOIR LE FORUM' : 'OUVRIR SUR LISIBLE'}
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <div style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
            <p style="margin: 0;">${isDirectMessage ? "Via le système sécurisé Lisible" : "Par : " + reportData.reporterEmail}</p>
            <p style="margin: 4px 0 0 0;"><strong>Date :</strong> ${reportData.date}</p>
            <p style="margin: 20px 0 0 0; font-weight: bold; color: #cbd5e1;">Système Lisible</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur API Report:", error);
    return NextResponse.json({ error: "Échec du traitement" }, { status: 500 });
  }
}
