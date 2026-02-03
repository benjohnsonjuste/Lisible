import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body; // On utilise l'email comme ID
  if (!email) return res.status(400).json({ error: "Email requis" });

  try {
    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);

    if (!userRes) return res.status(404).json({ error: "Utilisateur introuvable" });
    let user = userRes.content;

    // Création d'un token temporaire stocké directement dans le profil JSON
    const token = uuidv4();
    user.deletionToken = {
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h
    };

    // Sauvegarde sur GitHub
    await updateFile(path, user, userRes.sha, `🛠 Demande de suppression : ${email}`);

    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/account/confirm-delete?token=${token}&email=${encodeURIComponent(email)}`;

    // Configuration Nodemailer (comme dans tes autres APIs)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: '"Lisible" <security@lisible.biz>',
      to: email,
      subject: "Confirmation de suppression de compte",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Suppression de compte</h2>
          <p>Bonjour ${user.penName || user.name},</p>
          <p>Vous avez demandé la suppression de votre compte Lisible.</p>
          <p><a href="${confirmUrl}" style="background: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmer la suppression définitive</a></p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
