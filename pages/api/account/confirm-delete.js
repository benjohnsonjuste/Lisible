// /pages/api/account/confirm-delete.js
import { prisma } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { token } = req.query;
  if (!token) return res.status(400).send("Token manquant");

  const record = await prisma.deletionToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).send("Lien invalide ou expiré");
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { status: "deleted", deletedAt: new Date() }, // soft-delete
  });

  await prisma.deletionToken.delete({ where: { token } });

  res.redirect("/account-deleted"); // page de confirmation
}
