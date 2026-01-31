import { Buffer } from "buffer";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Non autorisé" });

  const { email, amountLi, amountUSD } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const path = `data/users/${email.toLowerCase().trim()}.json`;

  try {
    // 1. Récupérer le profil pour vérification
    const getFile = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getFile.ok) return res.status(404).json({ error: "Profil introuvable" });

    const fileInfo = await getFile.json();
    let user = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

    // 2. Sécurité : Vérifier l'éligibilité réelle
    const isEligible = (user.subscribers?.length || 0) >= 250;
    const hasEnough = (user.wallet?.balance || 0) >= amountLi;

    if (!isEligible || !hasEnough) {
      return res.status(400).json({ error: "Conditions de retrait non remplies." });
    }

    // 3. Débiter le portefeuille
    user.wallet.balance -= amountLi;
    user.wallet.history.unshift({
      id: `withdraw-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -amountLi,
      reason: `Retrait de ${amountUSD}$`,
      type: "withdrawal"
    });

    // 4. Sauvegarde sur GitHub
    await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `💸 Retrait validé pour ${user.penName} (${amountUSD}$)`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: fileInfo.sha
      }),
    });

    // 5. Envoi de l'Email automatique au Staff
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

  const method = user.paymentMethod || "Non spécifié";
  const details = method === "PayPal" 
    ? `Email PayPal : ${user.paypalEmail}` 
    : `Bénéficiaire : ${user.wuMoneyGram?.firstName} ${user.wuMoneyGram?.lastName} (${user.wuMoneyGram?.country})`;

  await transporter.sendMail({
    from: '"Lisible Finance" <finance@lisible.biz>',
    to: 'cmo.lablitteraire7@gmail.com',
    subject: `🚨 ORDRE DE PAIEMENT : ${user.penName} (${amountUSD}$)`,
    html: `
      <div style="font-family: sans-serif; border: 2px solid #14b8a6; padding: 20px; border-radius: 20px;">
        <h2 style="color: #14b8a6;">Nouvelle demande de retrait</h2>
        <p>L'auteur <b>${user.penName}</b> a validé un retrait de gains.</p>
        <hr>
        <p><b>Montant à payer :</b> ${amountUSD} USD</p>
        <p><b>Équivalence :</b> ${amountLi} Li débités</p>
        <p><b>Méthode de paiement :</b> ${method}</p>
        <p><b>Coordonnées :</b> ${details}</p>
        <hr>
        <p style="font-size: 10px; color: gray;">ID Transaction : tx_pay_${Date.now()}</p>
      </div>
    `
  });
}
