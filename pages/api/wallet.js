import { Buffer } from "buffer";

export default async function handler(req, res) {
  const { email, amount, reason } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const path = `data/users/${email.toLowerCase().trim()}.json`;

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

    // Mise à jour du solde de Li
    user.wallet.balance += amount;
    user.wallet.history.push({
      date: new Date().toISOString(),
      amount,
      reason
    });

    // Sauvegarde sur GitHub
    await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `🪙 Transaction : ${amount} Li pour ${email}`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: fileInfo.sha
      }),
    });

    return res.status(200).json({ balance: user.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
