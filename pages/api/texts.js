import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // --- LOGIQUE POST : CRÉATION D'UNE NOUVELLE PUBLICATION ---
  if (req.method === "POST") {
    try {
      const textData = req.body;
      const slug = textData.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 30);
      const id = `${slug}-${Date.now()}`;
      const path = `data/publications/${id}.json`;

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `📖 Publication : ${textData.title}`,
          content: Buffer.from(JSON.stringify({ ...textData, id }, null, 2)).toString("base64"),
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'écriture sur GitHub");

      // --- LOGIQUE DE NOTIFICATION DES ABONNÉS ---
      const origin = req.headers.origin || `https://${req.headers.host}`;
      const authorIdentifier = textData.authorEmail.replace(/[.@]/g, '_');
      const authorProfilePath = `data/users/${authorIdentifier}.json`;

      try {
        const userRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${authorProfilePath}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userRes.ok) {
          const userDataFile = await userRes.json();
          const userData = JSON.parse(Buffer.from(userDataFile.content, "base64").toString("utf-8"));
          
          if (userData.subscribers && Array.isArray(userData.subscribers)) {
            // Envoyer une notification à chaque abonné
            const notifPromises = userData.subscribers.map(sub => 
              fetch(`${origin}/api/create-notif`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  targetEmail: sub.email,
                  type: "new_publication",
                  message: `${textData.authorPenName || "Une plume que vous suivez"} a publié : "${textData.title}"`,
                  link: `/texte/${id}`
                })
              }).catch(e => console.error(`Notif failed for ${sub.email}`, e))
            );
            await Promise.all(notifPromises);
          }
        }
      } catch (notifErr) {
        console.warn("Échec de l'envoi des notifications aux abonnés:", notifErr);
      }

      return res.status(200).json({ success: true, id });
    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: "Échec de la publication sur le serveur." });
    }
  }

  // --- LOGIQUE PATCH : MISE À JOUR ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    if (!id) return res.status(400).json({ error: "ID du texte manquant" });

    const textPath = `data/publications/${id}.json`;

    try {
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!getRes.ok) throw new Error("Texte introuvable.");

      const fileData = await getRes.json();
      let textData = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      const origin = req.headers.origin || `https://${req.headers.host}`;

      if (action === "certify") {
        textData.totalCertified = (textData.totalCertified || 0) + 1;

        await fetch(`${origin}/api/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: textData.authorEmail,
            amount: 1,
            reason: `Certification : ${textData.title}`,
            type: "reward",
            isConcours: textData.isConcours || false
          })
        });

        await fetch(`${origin}/api/create-notif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetEmail: textData.authorEmail,
            type: "certified_read",
            message: `Nouveau sceau apposé sur "${textData.title}" !`,
            amountLi: 1
          })
        });
      }

      if (action === "like") {
        textData.totalLikes = (textData.totalLikes || 0) + 1;
      }

      if (action === "view") {
        textData.views = (textData.views || 0) + 1;
      }

      if (action === "comment") {
        if (!textData.comments) textData.comments = [];
        textData.comments.push({
          userName: payload.userName || "Une plume",
          text: payload.text,
          date: new Date().toISOString()
        });
      }

      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📊 Stats update [${action}] : ${textData.title}`,
          content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
          sha: fileData.sha
        })
      });

      return res.status(200).json({ success: true, totalCertified: textData.totalCertified });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
