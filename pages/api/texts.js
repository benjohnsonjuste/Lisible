import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const branch = "main";

  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const { id, action, payload } = req.body;
  const path = `data/publications/${id}.json`;

  // URL de base pour les appels API internes
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${req.headers.host}`;

  // --- HELPER: ENVOI DE NOTIFICATION ---
  const sendNotif = async (targetEmail, message, type, amountLi = 0) => {
    try {
      await fetch(`${baseUrl}/api/create-notif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, message, type, amountLi, link: "/dashboard" }),
      });
    } catch (e) { console.error("Notif Error:", e); }
  };

  // --- HELPER: CRÉDIT DE LI ---
  const creditUserLi = async (email, amount, reason, type = "income") => {
    if (!email || amount <= 0) return;
    const userPath = `data/users/${email.toLowerCase().trim()}.json`;
    try {
      const resU = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
      });
      if (!resU.ok) return;
      const file = await resU.json();
      let user = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
      
      if (!user.wallet) user.wallet = { balance: 0, history: [], totalEarned: 0 };
      user.wallet.balance += amount;
      if (type === "income") user.wallet.totalEarned += amount;
      user.wallet.history.unshift({ id: `tx-${Date.now()}`, date: new Date().toISOString(), amount, reason, type });
      user.wallet.history = user.wallet.history.slice(0, 30);

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🪙 +${amount} Li : ${reason}`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: file.sha, branch
        }),
      });

      // Notification Pusher après crédit réussi
      await sendNotif(email, `+${amount} Li : ${reason}`, "li_received", amount);
      
    } catch (e) { console.error("Wallet Error:", e); }
  };

  try {
    const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    });
    const fileInfo = await getFile.json();
    let data = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

    switch (action) {
      case "certify":
        // 1. Mise à jour du compteur sur le texte
        data.certifiedReads = (data.certifiedReads || 0) + 1;
        
        // 2. Récompense Auteur (Revenu de création)
        await creditUserLi(data.authorEmail, 5, `Lecture Certifiée : ${data.title}`, "income");
        
        // 3. Récompense Lecteur (Prime d'attention)
        if (payload?.readerEmail && payload.readerEmail !== data.authorEmail) {
          await creditUserLi(payload.readerEmail, 1, `Attention validée : ${data.title}`, "reward");
        }
        break;

      case "view":
        data.views = (data.views || 0) + 1;
        break;
      
      case "like":
        if (!data.likes) data.likes = [];
        const readerEmail = payload?.email;
        if (readerEmail) {
            data.likes = data.likes.includes(readerEmail) 
              ? data.likes.filter(e => e !== readerEmail) 
              : [...data.likes, readerEmail];
        }
        break;
    }

    // Sauvegarde du texte mis à jour sur GitHub
    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        message: `✨ ${action} : ${data.title}`,
        content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
        sha: fileInfo.sha, branch
      }),
    });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
