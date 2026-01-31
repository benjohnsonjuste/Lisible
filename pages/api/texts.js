import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const branch = "main";

  if (!token) return res.status(500).json({ error: "Configuration serveur incomplète" });

  // --- AUTOMATISATION : ENVOI DE NOTIFICATION ---
  const triggerNotification = async (notifData) => {
    try {
      // On appelle ton API de notification interne pour prévenir l'auteur en temps réel via Pusher
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifData),
      });
    } catch (e) { console.error("Notif Auto Error:", e); }
  };

  // --- MOTEUR DE CRÉDIT DE "LI" ---
  const creditUserLi = async (email, amount, reason, type = "income") => {
    if (!email || amount <= 0) return;
    const userPath = `data/users/${email.toLowerCase().trim()}.json`;
    
    try {
      const resUser = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      if (!resUser.ok) return;
      const file = await resUser.json();
      let user = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
      
      if (!user.wallet) user.wallet = { balance: 0, history: [], totalEarned: 0 };
      user.wallet.balance += amount;
      if (type === "income") user.wallet.totalEarned += amount;

      user.wallet.history.unshift({ 
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(), 
        amount, reason, type 
      });

      user.wallet.history = user.wallet.history.slice(0, 50);

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${userPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🪙 Transaction Li : +${amount} (${reason})`,
          content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
          sha: file.sha, branch
        }),
      });
    } catch (e) { console.error("Erreur Wallet Sync:", e); }
  };

  // --- GESTION DES INTERACTIONS AUTOMATISÉES (PATCH) ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    const path = `data/publications/${id}.json`;

    try {
      const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!getFile.ok) return res.status(404).json({ error: "Contenu introuvable" });

      const fileInfo = await getFile.json();
      let data = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

      switch (action) {
        case "view":
          data.views = (data.views || 0) + 1;
          break;
        
        case "certify":
          data.certifiedReads = (data.certifiedReads || 0) + 1;
          
          // 1. Crédit automatique
          await creditUserLi(data.authorEmail, 5, `Lecture Certifiée : ${data.title}`, "income");
          
          // 2. Notification automatique à l'auteur (Temps Réel)
          await triggerNotification({
            type: "li_received",
            targetEmail: data.authorEmail,
            message: `+5 Li reçus pour "${data.title}" (Lecture certifiée) !`,
            link: "/analytics",
            amountLi: 5
          });

          // 3. Récompense automatique au lecteur
          if (payload?.readerEmail) {
            await creditUserLi(payload.readerEmail, 1, `Badge de Lecture : ${data.title}`, "reward");
          }
          break;

        case "like":
          if (!data.likes) data.likes = [];
          const alreadyLiked = data.likes.includes(payload.email);
          data.likes = alreadyLiked 
            ? data.likes.filter(e => e !== payload.email) 
            : [...data.likes, payload.email];
          
          // Notification auto si c'est un nouveau Like
          if (!alreadyLiked) {
             await triggerNotification({
                type: "like",
                targetEmail: data.authorEmail,
                message: `${payload.userName || "Quelqu'un"} a aimé votre œuvre : ${data.title}`,
                link: `/lecture/${id}`
             });
          }
          break;

        case "comment":
          if (!data.comments) data.comments = [];
          data.comments.push({ 
            userName: payload.userName, 
            text: payload.text, 
            date: new Date().toISOString() 
          });

          // Notification auto pour le commentaire
          await triggerNotification({
            type: "comment",
            targetEmail: data.authorEmail,
            message: `Nouveau commentaire de ${payload.userName} sur "${data.title}"`,
            link: `/lecture/${id}`
          });
          break;
      }

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `✨ Evolution : ${action} sur ${data.title}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
          sha: fileInfo.sha, branch
        }),
      });

      return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }
}
