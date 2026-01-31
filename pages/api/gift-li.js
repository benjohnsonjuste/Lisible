import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { readerEmail, authorEmail, amount, textTitle } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (!readerEmail || !authorEmail || !amount) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  // Déterminer l'URL pour les appels internes
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${req.headers.host}`;

  // --- FONCTION DE MISE À JOUR DU PORTEFEUILLE ---
  const updateWallet = async (email, value, reason, type) => {
    const path = `data/users/${email.toLowerCase().trim()}.json`;
    
    const resU = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    });

    if (!resU.ok) throw new Error(`Profil introuvable pour ${email}`);
    
    const file = await resU.json();
    let user = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));

    if (!user.wallet) user.wallet = { balance: 0, history: [], totalEarned: 0 };

    // Vérification de solde pour le débit
    if (value < 0 && user.wallet.balance < Math.abs(value)) {
      throw new Error("Solde Li insuffisant");
    }

    user.wallet.balance += value;
    if (value > 0 && type === "gift_received") user.wallet.totalEarned += value;

    user.wallet.history.unshift({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      amount: value,
      reason: reason,
      type: type
    });

    user.wallet.history = user.wallet.history.slice(0, 30);

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🎁 Gift Li : ${reason}`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: file.sha
      }),
    });
    
    return user;
  };

  try {
    // 1. Débiter le Lecteur
    await updateWallet(readerEmail, -amount, `Cadeau envoyé pour: ${textTitle}`, "gift_sent");
    
    // 2. Créditer l'Auteur
    await updateWallet(authorEmail, amount, `Cadeau reçu pour: ${textTitle}`, "gift_received");

    // 3. Notification en temps réel pour l'Auteur
    try {
      await fetch(`${baseUrl}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "li_received",
          targetEmail: authorEmail,
          message: `🎁 Un lecteur vous a offert ${amount} Li pour "${textTitle}" !`,
          amountLi: amount,
          link: "/dashboard"
        })
      });
    } catch (notifErr) {
      console.error("Erreur Notification:", notifErr);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("Gift Error:", e.message);
    return res.status(400).json({ error: e.message });
  }
}
