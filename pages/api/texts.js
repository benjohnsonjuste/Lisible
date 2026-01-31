import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const branch = "main";

  if (!token) return res.status(500).json({ error: "Token manquant" });

  // --- LOGIQUE DE CRÉDIT DE "LI" (Fonction interne) ---
  const creditUserLi = async (email, amount, reason) => {
    if (!email) return;
    const userPath = `data/users/${email.toLowerCase().trim()}.json`;
    try {
      const resUser = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!resUser.ok) return;
      const file = await resUser.json();
      let user = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
      
      if (!user.wallet) user.wallet = { balance: 0, history: [] };
      user.wallet.balance += amount;
      user.wallet.history.push({ date: new Date().toISOString(), amount, reason });

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🪙 +${amount} Li : ${reason}`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: file.sha, branch
        }),
      });
    } catch (e) { console.error("Erreur Wallet:", e); }
  };

  // --- PATCH : INTERACTIONS ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    const path = `data/publications/${id}.json`;

    try {
      const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!getFile.ok) return res.status(404).json({ error: "Texte introuvable" });

      const fileInfo = await getFile.json();
      let data = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

      switch (action) {
        case "view":
          data.views = (data.views || 0) + 1;
          break;
        
        case "certify":
          data.certifiedReads = (data.certifiedReads || 0) + 1;
          // RECOMPENSE : On crédite l'auteur pour cette lecture de qualité
          // On peut aussi créditer le lecteur si payload.readerEmail est fourni
          await creditUserLi(data.authorEmail, 5, `Lecture certifiée : ${data.title}`);
          if (payload?.readerEmail) {
            await creditUserLi(payload.readerEmail, 2, `Sceau de lecture : ${data.title}`);
          }
          break;

        case "like":
          if (!data.likes) data.likes = [];
          data.likes = data.likes.includes(payload.email) 
            ? data.likes.filter(e => e !== payload.email) 
            : [...data.likes, payload.email];
          break;

        case "comment":
          if (!data.comments) data.comments = [];
          data.comments.push({ 
            userName: payload.userName, 
            text: payload.text, 
            date: new Date().toISOString() 
          });
          break;
      }

      const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `✨ interaction : ${action} sur ${data.title}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
          sha: fileInfo.sha, branch
        }),
      });

      return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
  
  // (Le reste de ton code POST reste identique...)
}
