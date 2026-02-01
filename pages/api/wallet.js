import { getFile, updateFile } from "@/lib/github";
import { getEmailId } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, amount, reason, targetEmail, type = "system" } = req.body;

  try {
    // 1. Charger l'expéditeur (ou l'utilisateur concerné)
    const userPath = `data/users/${getEmailId(email)}.json`;
    const userFile = await getFile(userPath);
    if (!userFile) return res.status(404).json({ error: "Utilisateur introuvable" });

    let userData = userFile.content;

    // CAS : TRANSFERT ENTRE UTILISATEURS
    if (targetEmail) {
      if (userData.wallet.balance < amount) return res.status(400).json({ error: "Solde insuffisant" });
      if (amount < 1000) return res.status(400).json({ error: "Minimum 1000 Li pour un transfert" });

      const targetPath = `data/users/${getEmailId(targetEmail)}.json`;
      const targetFile = await getFile(targetPath);
      if (!targetFile) return res.status(404).json({ error: "Destinataire introuvable" });

      let targetData = targetFile.content;

      // Déduire de l'expéditeur
      userData.wallet.balance -= amount;
      userData.wallet.history.unshift({
        id: `send-${Date.now()}`,
        date: new Date().toISOString(),
        amount: -amount,
        reason: `Envoi à ${targetData.penName || targetEmail}`,
        type: "transfer_sent"
      });

      // Ajouter au destinataire
      targetData.wallet.balance += amount;
      targetData.wallet.history.unshift({
        id: `recv-${Date.now()}`,
        date: new Date().toISOString(),
        amount: amount,
        reason: `Reçu de ${userData.penName || email}`,
        type: "transfer_received"
      });

      // Sauvegarder les deux
      await updateFile(userPath, userData, userFile.sha, `💸 Envoi Li vers ${targetEmail}`);
      await updateFile(targetPath, targetData, targetFile.sha, `💰 Réception Li de ${email}`);
      
      return res.status(200).json({ success: true, balance: userData.wallet.balance });
    }

    // CAS : CRÉDIT SIMPLE (Certification ou Achat)
    userData.wallet.balance += amount;
    userData.wallet.history.unshift({
      id: `credit-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      reason,
      type
    });

    await updateFile(userPath, userData, userFile.sha, `🪙 Wallet Update: ${reason}`);
    return res.status(200).json({ success: true, balance: userData.wallet.balance });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
