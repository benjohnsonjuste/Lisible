import { Buffer } from "buffer";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, amountLi } = req.body;
  const token = process.env.GITHUB_TOKEN;
  
  const LI_VALUATION = 0.0002; // 1000 Li = 0.20$
  const MIN_WITHDRAW_LI = 25000; // Seuil 5$

  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const getFile = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getFile.ok) return res.status(404).json({ error: "Profil introuvable" });

    const fileInfo = await getFile.json();
    let user = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

    // Vérifications de sécurité
    const currentBalance = user.wallet?.balance || 0;
    const subscribersCount = user.stats?.subscribers || 0;
    const amountUSD = (amountLi * LI_VALUATION).toFixed(2);

    if (subscribersCount < 250) {
       return res.status(400).json({ error: "Monétisation désactivée (minimum 250 abonnés)." });
    }

    if (currentBalance < amountLi || amountLi < MIN_WITHDRAW_LI) {
       return res.status(400).json({ error: "Solde insuffisant ou inférieur au seuil de 5$." });
    }

    // Débit du portefeuille
    user.wallet.balance -= amountLi;
    user.wallet.history.unshift({
      id: `withdraw-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -amountLi,
      reason: `Demande de retrait de ${amountUSD}$`,
      status: "pending"
    });

    // Mise à jour GitHub
    await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `💸 Demande de retrait : ${user.penName} (${amountUSD}$)`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: fileInfo.sha
      }),
    });

    // Envoi de l'email au staff
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
    html: `
      <div style="font-family: sans-serif; border: 2px solid #14b8a6; padding: 25px; border-radius: 20px;">
        <h2 style="color: #14b8a6;">Nouvelle demande de retrait</h2>
        <p>L'auteur <b>${user.penName}</b> (${user.email}) vient de valider un retrait.</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; margin: 20px 0;">
          <p><b>Montant à verser :</b> ${amountUSD} USD</p>
          <p><b>Li débités :</b> ${amountLi.toLocaleString()}</p>
          <p><b>Méthode choisie :</b> ${method}</p>
          <p><b>Infos paiement :</b> ${details}</p>
        </div>
        <p style="font-size: 11px; color: #64748b;">Veuillez traiter ce paiement sous 48h ouvrées.</p>
      </div>
    `
  });
}
