import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, amount, reason } = req.body;
  const token = process.env.GITHUB_TOKEN;
  
  // Formatage du nom de fichier en base64 (identique à ton Dashboard)
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const getFile = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!getFile.ok) return res.status(404).json({ error: "Utilisateur introuvable" });

    const fileInfo = await getFile.json();
    let user = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

    // Initialisation du portefeuille si inexistant
    if (!user.wallet) {
      user.wallet = { balance: 0, history: [] };
    }

    // Mise à jour du solde
    user.wallet.balance += parseInt(amount);
    user.wallet.history.push({
      id: `li-${Date.now()}`,
      date: new Date().toISOString(),
      amount: parseInt(amount),
      reason: reason || "Récompense de lecture"
    });

    // Sauvegarde
    const resGh = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🪙 Wallet Update : +${amount} Li pour ${user.penName}`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: fileInfo.sha
      }),
    });

    if (!resGh.ok) throw new Error("Échec de la sauvegarde GitHub");

    return res.status(200).json({ success: true, balance: user.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
