// pages/api/withdraw.js
import { getFile, updateFile, getEmailId } from "@/lib/github";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, amountLi } = req.body;
  const LI_VALUATION = 0.0002;
  const MIN_WITHDRAW_LI = 25000;

  try {
    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);
    if (!userRes) return res.status(404).json({ error: "Profil introuvable" });

    let user = userRes.content;
    const currentBalance = user.wallet?.balance || 0;
    const subscribersCount = user.subscribers?.length || 0; // Corrigé : utilise la longueur du tableau
    const amountUSD = (amountLi * LI_VALUATION).toFixed(2);

    if (subscribersCount < 250) {
       return res.status(400).json({ error: "Minimum 250 abonnés requis." });
    }

    if (currentBalance < amountLi || amountLi < MIN_WITHDRAW_LI) {
       return res.status(400).json({ error: "Solde insuffisant ou seuil non atteint." });
    }

    // Débit
    user.wallet.balance -= amountLi;
    user.wallet.history.unshift({
      id: `withdraw-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -amountLi,
      reason: `Retrait : ${amountUSD}$`,
      status: "pending"
    });

    await updateFile(path, user, userRes.sha, `💸 Demande retrait ${email}`);
    await sendPaymentOrderEmail(user, amountUSD, amountLi);

    return res.status(200).json({ success: true, newBalance: user.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function sendPaymentOrderEmail(user, amountUSD, amountLi) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const method = user.paymentMethod || "Non défini";
  const details = method === "PayPal" 
    ? `Email PayPal : ${user.paypalEmail}` 
    : `Western Union : ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName} (${user.wuMoneyGram?.country})`;

  await transporter.sendMail({
    from: '"Lisible Finance" <finance@lisible.biz>',
    to: 'cmo.lablitteraire7@gmail.com',
    subject: `🚨 ORDRE DE PAIEMENT : ${user.penName} (${amountUSD}$)`,
    html: `<div style="padding:20px; border:2px solid #14b8a6; border-radius:15px;">
             <h2>Demande de retrait</h2>
             <p>Auteur : <b>${user.penName}</b></p>
             <p>Montant : <b>${amountUSD} USD</b> (${amountLi} Li)</p>
             <p>Méthode : ${method}</p>
             <p>Détails : ${details}</p>
           </div>`
  });
}
