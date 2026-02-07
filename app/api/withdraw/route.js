// app/api/withdraw/route.js
import { getFile, updateFile, getEmailId } from "@/lib/github";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, amountLi } = body;
    
    const LI_VALUATION = 0.0002;
    const MIN_WITHDRAW_LI = 25000;

    if (!email || !amountLi) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);
    if (!userRes) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let user = userRes.content;
    const currentBalance = user.wallet?.balance || 0;
    const subscribersCount = Array.isArray(user.subscribers) ? user.subscribers.length : 0;
    const amountUSD = (amountLi * LI_VALUATION).toFixed(2);

    // Vérification des conditions de retrait
    if (subscribersCount < 250) {
      return new Response(JSON.stringify({ error: "Minimum 250 abonnés requis." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (currentBalance < amountLi || amountLi < MIN_WITHDRAW_LI) {
      return new Response(JSON.stringify({ error: "Solde insuffisant ou seuil non atteint (25k Li)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Débit du portefeuille
    user.wallet.balance -= amountLi;
    if (!user.wallet.history) user.wallet.history = [];
    
    user.wallet.history.unshift({
      id: `withdraw-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -amountLi,
      reason: `Retrait : ${amountUSD}$`,
      status: "pending"
    });

    // Mise à jour sur GitHub
    await updateFile(path, user, userRes.sha, `💸 Demande retrait ${email}`);

    // Notification par email au Staff
    try {
      await sendPaymentOrderEmail(user, amountUSD, amountLi);
    } catch (mailErr) {
      console.error("Erreur email finance:", mailErr);
      // On ne bloque pas le client si l'email échoue mais que le débit GitHub est fait
    }

    return new Response(JSON.stringify({ 
      success: true, 
      newBalance: user.wallet.balance 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Withdraw API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Fonction utilitaire d'envoi d'ordre de paiement
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
    subject: `🚨 ORDRE DE PAIEMENT : ${user.penName || user.email} (${amountUSD}$)`,
    html: `
      <div style="font-family: sans-serif; padding:20px; border:2px solid #14b8a6; border-radius:15px;">
        <h2 style="color: #14b8a6;">Demande de retrait confirmée</h2>
        <p>Auteur : <b>${user.penName || "Anonyme"}</b> (${user.email})</p>
        <p>Montant : <b>${amountUSD} USD</b> (${amountLi} Li)</p>
        <hr>
        <p><b>Méthode de paiement :</b> ${method}</p>
        <p><b>Coordonnées :</b> ${details}</p>
        <hr>
        <p style="font-size: 11px; color: #666;">Note : Le débit a été effectué sur le compte GitHub de l'utilisateur.</p>
      </div>
    `
  });
}
