// /pages/api/account/delete-request.js
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email"; // à adapter selon ton système
import { prisma } from "@/lib/db"; // ou ton ORM

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requis" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.deletionToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm-delete?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Confirmation de suppression de compte",
    html: `
      <p>Bonjour ${user.name},</p>
      <p>Vous avez demandé la suppression de votre compte Lisible.</p>
      <p>Pour confirmer, cliquez sur le lien ci-dessous :</p>
      <p><a href="${confirmUrl}">Confirmer la suppression</a></p>
      <p>Ce lien expirera dans 24 heures.</p>
    `,
  });

  res.status(200).json({ message: "Email envoyé" });
}
