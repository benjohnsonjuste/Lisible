// pages/api/process-purchase.js (Version corrigée)
import { getFile, updateFile, getEmailId } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, amount, packId } = req.body;

  try {
    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);
    
    if (!userRes) return res.status(404).json({ error: "User not found" });
    let user = userRes.content;

    if (!user.wallet) user.wallet = { balance: 0, history: [] };
    
    user.wallet.balance += amount;
    user.wallet.history.unshift({ 
        id: `buy-${Date.now()}`, 
        date: new Date().toISOString(), 
        amount, 
        reason: `Achat Pack ${packId}`, 
        type: "purchase" 
    });

    await updateFile(path, user, userRes.sha, `💰 Purchase: +${amount} for ${email}`);
    return res.status(200).json({ success: true, balance: user.wallet.balance });
  } catch (error) { 
    return res.status(500).json({ error: error.message }); 
  }
}
