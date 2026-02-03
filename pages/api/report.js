// pages/api/report.js
import { getFile, updateFile, getEmailId } from "@/lib/github";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { textId, reporterEmail, reason, details } = req.body;

  try {
    // 1. Récupérer le texte signalé pour avoir ses infos
    const path = `data/publications/${textId}.json`;
    const textRes = await getFile(path);
    if (!textRes) return res.status(404).json({ error: "Texte introuvable" });
    
    let text = textRes.content;

    // 2. Marquer le texte comme "Signalé" dans le JSON
    if (!text.reports) text.reports = [];
    text.reports.push({
      reporter: reporterEmail,
      reason,
      details,
      date: new Date().toISOString()
    });
    
    // Si trop de signalements (ex: 5), on peut masquer automatiquement le texte
    if (text.reports.length >= 5) {
      text.status = "under_review";
    }

    await updateFile(path, text, textRes.sha, `🚩 Texte signalé : ${textId}`);

    // 3. Envoyer un email d'alerte au staff
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

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

    return res.status(200).json({ success: true, message: "Signalement enregistré" });
  } catch (e) {
    return res.status(500).json({ error: "Échec du signalement" });
  }
}
