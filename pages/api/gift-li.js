// pages/api/gift-li.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { readerEmail, authorEmail, amount, textTitle } = req.body;
  const giftAmount = parseInt(amount);

  try {
    // 1. Charger les deux profils en parallèle
    const [readerRes, authorRes] = await Promise.all([
      getFile(`data/users/${getEmailId(readerEmail)}.json`),
      getFile(`data/users/${getEmailId(authorEmail)}.json`)
    ]);

    if (!readerRes || !authorRes) return res.status(404).json({ error: "Utilisateurs introuvables" });

    let reader = readerRes.content;
    let author = authorRes.content;

    // 2. Vérification du solde
    if (reader.wallet.balance < giftAmount) {
      return res.status(400).json({ error: "Solde insuffisant" });
    }

    // 3. Exécuter la transaction
    reader.wallet.balance -= giftAmount;
    reader.wallet.history.unshift({
      id: `gift-sent-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -giftAmount,
      reason: `Cadeau offert pour : ${textTitle}`,
      type: "gift_sent"
    });

    author.wallet.balance += giftAmount;
    author.wallet.history.unshift({
      id: `gift-received-${Date.now()}`,
      date: new Date().toISOString(),
      amount: giftAmount,
      reason: `Cadeau reçu de ${reader.penName || "Un lecteur"}`,
      type: "gift_received"
    });

    // 4. Sauvegarde simultanée
    await Promise.all([
      updateFile(`data/users/${getEmailId(readerEmail)}.json`, reader, readerRes.sha, `🎁 Don envoyé par ${readerEmail}`),
      updateFile(`data/users/${getEmailId(authorEmail)}.json`, author, authorRes.sha, `💰 Don reçu par ${authorEmail}`)
    ]);

    // 5. Déclencher la notification Pusher (appel asynchrone pour ne pas bloquer la réponse)
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    fetch(`${baseUrl}/api/create-notif`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "li_received",
        targetEmail: authorEmail,
        message: `🎁 ${reader.penName || "Un lecteur"} vous a offert ${giftAmount} Li !`,
        amountLi: giftAmount,
        link: "/dashboard"
      })
    }).catch(err => console.error("Notif failed:", err));

    return res.status(200).json({ success: true, newBalance: reader.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: "Erreur lors du transfert de cadeau" });
  }
}
