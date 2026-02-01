import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, amount, reason } = req.body;
  // Unification du chemin via Base64 (identique à ton Dashboard)
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const userFile = await getFile(path);
    if (!userFile) return res.status(404).json({ error: "Utilisateur introuvable" });

    let user = userFile.content;
    if (!user.wallet) user.wallet = { balance: 0, history: [] };

    const change = parseInt(amount);
    user.wallet.balance += change;
    user.wallet.history.unshift({
      id: `li-${Date.now()}`,
      date: new Date().toISOString(),
      amount: change,
      reason: reason || "Transaction système"
    });

    const success = await updateFile(path, user, userFile.sha, `🪙 Wallet: ${change} Li`);
    
    if (!success) throw new Error("Erreur de mise à jour GitHub");
    return res.status(200).json({ success: true, balance: user.wallet.balance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
