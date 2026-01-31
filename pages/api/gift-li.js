// /pages/api/gift-li.js
import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { readerEmail, authorEmail, amount, textTitle } = req.body;
  const token = process.env.GITHUB_TOKEN;
  
  try {
    // 1. Débiter le Lecteur
    await updateWallet(readerEmail, -amount, `Cadeau envoyé à l'auteur de: ${textTitle}`, "gift_sent");
    
    // 2. Créditer l'Auteur
    await updateWallet(authorEmail, amount, `Cadeau reçu de ${readerEmail} pour: ${textTitle}`, "gift_received");

    // 3. Envoyer une notification automatique à l'auteur
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
      method: "POST",
      body: JSON.stringify({
        type: "li_received",
        targetEmail: authorEmail,
        message: `🎁 ${readerEmail} vous a offert ${amount} Li pour "${textTitle}" !`,
        amountLi: amount
      })
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
