// app/api/account/request-delete/route.js
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { getFile, updateFile, getEmailId } from "@/lib/github";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);

    if (!userRes) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let user = userRes.content;

    // Création d'un token temporaire stocké directement dans le profil JSON
    const token = uuidv4();
    user.deletionToken = {
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h
    };

    // Sauvegarde sur GitHub
    await updateFile(path, user, userRes.sha, `🛠 Demande de suppression : ${email}`);

    // Construction de l'URL de confirmation
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/confirm-delete?token=${token}&email=${encodeURIComponent(email)}`;

    // Configuration Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    await transporter.sendMail({
      from: '"Lisible" <security@lisible.biz>',
      to: email,
      subject: "Confirmation de suppression de compte",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0f172a;">Suppression de compte</h2>
          <p>Bonjour ${user.penName || user.name},</p>
          <p>Vous avez demandé la suppression de votre compte Lisible.</p>
          <p style="margin: 30px 0;">
            <a href="${confirmUrl}" style="background: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Confirmer la suppression définitive
            </a>
          </p>
          <p style="color: #64748b; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre compte restera en sécurité.</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ message: "Email envoyé" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Request Delete Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
