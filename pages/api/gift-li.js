import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { readerEmail, authorEmail, amount, textTitle } = req.body;
  const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;

  try {
    // 1. Débiter le Lecteur via l'API Wallet
    const debitRes = await fetch(`${baseUrl}/api/wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: readerEmail, amount: -amount, reason: `Cadeau pour: ${textTitle}` })
    });
    if (!debitRes.ok) throw new Error("Solde insuffisant ou erreur de débit");

    // 2. Créditer l'Auteur
    await fetch(`${baseUrl}/api/wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: authorEmail, amount: amount, reason: `Cadeau reçu: ${textTitle}` })
    });

    // 3. Notification via ton API notif
    await fetch(`${baseUrl}/api/create-notif`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "li_received",
        targetEmail: authorEmail,
        message: `🎁 Un lecteur vous a offert ${amount} Li !`,
        amountLi: amount, link: "/dashboard"
      })
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
