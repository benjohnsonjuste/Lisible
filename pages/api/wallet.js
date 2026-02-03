// pages/api/wallet.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, amount, reason, targetEmail, type = "system" } = req.body;
  const val = parseInt(amount);

  try {
    const userPath = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(userPath);
    if (!userRes) return res.status(404).json({ error: "Utilisateur source introuvable" });

    let userData = userRes.content;

    // TRANSFERT ENTRE UTILISATEURS
    if (targetEmail) {
      if (val < 1000) return res.status(400).json({ error: "Minimum 1000 Li." });
      if (userData.wallet.balance < val) return res.status(400).json({ error: "Solde insuffisant." });

      const targetPath = `data/users/${getEmailId(targetEmail)}.json`;
      const targetRes = await getFile(targetPath);
      if (!targetRes) return res.status(404).json({ error: "Destinataire introuvable." });

      let targetData = targetRes.content;

      userData.wallet.balance -= val;
      userData.wallet.history.unshift({
        id: `send-${Date.now()}`,
        date: new Date().toISOString(), amount: -val,
        reason: `Envoi à ${targetData.penName || targetEmail}`, type: "transfer_sent"
      });

      targetData.wallet.balance += val;
      targetData.wallet.history.unshift({
        id: `recv-${Date.now()}`,
        date: new Date().toISOString(), amount: val,
        reason: `Reçu de ${userData.penName || email}`, type: "transfer_received"
      });

      await updateFile(userPath, userData, userRes.sha, `💸 Transfert vers ${targetEmail}`);
      await updateFile(targetPath, targetData, targetRes.sha, `💰 Réception de ${email}`);

      return res.status(200).json({ success: true, newBalance: userData.wallet.balance });
    }

    // CRÉDIT SIMPLE (Système ou Achat)
    userData.wallet.balance += val;
    userData.wallet.history.unshift({
      id: `wallet-${Date.now()}`,
      date: new Date().toISOString(),
      amount: val,
      reason: reason || "Mise à jour",
      type: type
    });

    await updateFile(userPath, userData, userRes.sha, `🪙 Mise à jour solde : ${email}`);
    return res.status(200).json({ success: true, newBalance: userData.wallet.balance });

  } catch (error) {
    return res.status(500).json({ error: "Erreur transactionnelle." });
  }
}
