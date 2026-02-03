// pages/api/certify.js
import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { readerEmail, textId, authorEmail } = req.body;
  const COST_LI = 1000; // Coût d'une certification

  try {
    // 1. Charger le lecteur
    const readerRes = await getFile(`data/users/${getEmailId(readerEmail)}.json`);
    if (!readerRes) return res.status(404).json({ error: "Lecteur introuvable" });
    let reader = readerRes.content;

    if (reader.wallet.balance < COST_LI) {
      return res.status(400).json({ error: "Solde Li insuffisant pour certifier." });
    }

    // 2. Charger l'auteur
    const authorRes = await getFile(`data/users/${getEmailId(authorEmail)}.json`);
    if (!authorRes) return res.status(404).json({ error: "Auteur introuvable" });
    let author = authorRes.content;

    // 3. Charger le texte
    const textRes = await getFile(`data/publications/${textId}.json`);
    if (!textRes) return res.status(404).json({ error: "Texte introuvable" });
    let text = textRes.content;

    // --- TRANSACTION ---
    // Débit lecteur
    reader.wallet.balance -= COST_LI;
    reader.wallet.history.unshift({
      id: `cert-out-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -COST_LI,
      reason: `Certification du texte: ${text.title}`,
      type: "certification_sent"
    });

    // Crédit auteur
    author.wallet.balance += COST_LI;
    author.wallet.history.unshift({
      id: `cert-in-${Date.now()}`,
      date: new Date().toISOString(),
      amount: COST_LI,
      reason: `Certification reçue pour: ${text.title}`,
      type: "certification_received"
    });

    // Mise à jour du texte
    text.totalCertified = (text.totalCertified || 0) + 1;
    if (!text.voters) text.voters = [];
    text.voters.push(readerEmail);

    // 4. SAUVEGARDE SYNCHRONE (Audit trail)
    await updateFile(`data/users/${getEmailId(readerEmail)}.json`, reader, readerRes.sha, `🛡️ Certification débit: ${readerEmail}`);
    await updateFile(`data/users/${getEmailId(authorEmail)}.json`, author, authorRes.sha, `💰 Certification crédit: ${authorEmail}`);
    await updateFile(`data/publications/${textId}.json`, text, textRes.sha, `✨ Texte certifié: ${textId}`);

    return res.status(200).json({ success: true, newBalance: reader.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: "Erreur lors de la certification" });
  }
}
