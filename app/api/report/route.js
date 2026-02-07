// app/api/report/route.js
import { getFile, updateFile } from "@/lib/github";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { textId, reporterEmail, reason, details } = body;

    if (!textId || !reporterEmail || !reason) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Récupérer le texte signalé pour avoir ses infos
    const path = `data/publications/${textId}.json`;
    const textRes = await getFile(path);
    
    if (!textRes) {
      return new Response(JSON.stringify({ error: "Texte introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    let text = textRes.content;

    // 2. Marquer le texte comme "Signalé" dans le JSON
    if (!text.reports) text.reports = [];
    text.reports.push({
      reporter: reporterEmail,
      reason,
      details,
      date: new Date().toISOString()
    });
    
    // Si trop de signalements (ex: 5), on masque automatiquement le texte
    if (text.reports.length >= 5) {
      text.status = "under_review";
    }

    await updateFile(path, text, textRes.sha, `🚩 Texte signalé : ${textId}`);

    // 3. Envoyer un email d'alerte au staff
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    try {
      await transporter.sendMail({
        from: '"Lisible Modération" <mod@lisible.biz>',
        to: 'cmo.lablitteraire7@gmail.com',
        subject: `🚩 SIGNALEMENT : ${text.title}`,
        html: `
          <div style="font-family: sans-serif; border: 2px solid #e11d48; padding: 20px; border-radius: 15px;">
            <h2 style="color: #e11d48;">Alerte de Contenu</h2>
            <p>Le texte <b>${text.title}</b> de <b>${text.penName}</b> a été signalé.</p>
            <hr>
            <p><b>Motif :</b> ${reason}</p>
            <p><b>Détails :</b> ${details || "Aucun détail fourni"}</p>
            <p><b>Signalé par :</b> ${reporterEmail}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">Ce texte a maintenant ${text.reports.length} signalement(s).</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error("Échec de l'envoi de l'email de signalement:", mailError);
      // On continue quand même car le signalement est enregistré sur GitHub
    }

    return new Response(JSON.stringify({ success: true, message: "Signalement enregistré" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Report Error:", error);
    return new Response(JSON.stringify({ error: "Échec du signalement" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
