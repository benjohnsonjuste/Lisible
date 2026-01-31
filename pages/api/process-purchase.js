import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, amount, packId } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = `data/users/${email.toLowerCase().trim()}.json`;

  try {
    const resGet = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    });
    if (!resGet.ok) throw new Error("User not found");
    const fileData = await resGet.json();
    let user = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));

    if (!user.wallet) user.wallet = { balance: 0, history: [], totalEarned: 0 };
    user.wallet.balance += amount;
    user.wallet.history.unshift({ id: `buy-${Date.now()}`, date: new Date().toISOString(), amount, reason: `Achat Pack ${packId}`, type: "purchase" });

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `💰 Purchase: +${amount} for ${email}`,
        content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
        sha: fileData.sha,
      }),
    });
    return res.status(200).json({ success: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}
