import { getFile, updateFile } from "@/lib/github";
import { getEmailId } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, amount, reason, targetEmail, type = "system" } = req.body;

  if (!email || !amount) return res.status(400).json({ error: "Données manquantes" });

  try {
    // 1. Récupérer l'utilisateur principal
    const userPath = `data/users/${getEmailId(email)}.json`;
    const userFile = await getFile(userPath);
    if (!userFile) return res.status(404).json({ error: "Utilisateur source introuvable" });

    let userData = userFile.content;

    // --- CAS A : TRANSFERT ENTRE UTILISATEURS ---
    if (targetEmail) {
      const val = parseInt(amount);
      if (val < 1000) return res.status(400).json({ error: "Le montant minimum de transfert est de 1000 Li." });
      if (userData.wallet.balance < val) return res.status(400).json({ error: "Solde insuffisant." });

      const targetPath = `data/users/${getEmailId(targetEmail)}.json`;
      const targetFile = await getFile(targetPath);
      if (!targetFile) return res.status(404).json({ error: "Destinataire introuvable dans la base Lisible." });

      let targetData = targetFile.content;

      // Débit Source
      userData.wallet.balance -= val;
      userData.wallet.history.unshift({
        id: `send-${Date.now()}`,
        date: new Date().toISOString(),
        amount: -val,
        reason: `Envoi à ${targetData.penName || targetEmail}`,
        type: "transfer_sent"
      });

      // Crédit Cible
      targetData.wallet.balance += val;
      targetData.wallet.history.unshift({
        id: `recv-${Date.now()}`,
        date: new Date().toISOString(),
        amount: val,
        reason: `Reçu de ${userData.penName || email}`,
        type: "transfer_received"
      });

      // Sauvegarde double
      await updateFile(userPath, userData, userFile.sha, `💸 Transfert de ${email} vers ${targetEmail}`);
      await updateFile(targetPath, targetData, targetFile.sha, `💰 Réception par ${targetEmail} de ${email}`);

      return res.status(200).json({ success: true, newBalance: userData.wallet.balance });
    }

    // --- CAS B : CRÉDIT (ACHAT OU RÉCOMPENSE) ---
    userData.wallet.balance += parseInt(amount);
    userData.wallet.history.unshift({
      id: `credit-${Date.now()}`,
      date: new Date().toISOString(),
      amount: parseInt(amount),
      reason: reason || "Mise à jour système",
      type: type
    });

    await updateFile(userPath, userData, userFile.sha, `🪙 Crédit : ${amount} Li pour ${email}`);
    return res.status(200).json({ success: true, newBalance: userData.wallet.balance });

  } catch (error) {
    console.error("Wallet API Error:", error);
    return res.status(500).json({ error: "Erreur technique lors de la transaction." });
  }
}
