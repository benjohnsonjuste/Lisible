import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (req.method === "GET") {
    try {
      const { limit = 10, lastId } = req.query;
      const indexRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      if (!indexRes.ok) return res.status(200).json({ data: [], nextCursor: null });
      
      const indexFile = await indexRes.json();
      const allTexts = JSON.parse(Buffer.from(indexFile.content, "base64").toString("utf-8"));

      allTexts.sort((a, b) => new Date(b.date) - new Date(a.date));

      let startIndex = 0;
      if (lastId) {
        startIndex = allTexts.findIndex(t => t.id === lastId) + 1;
        if (startIndex === 0) startIndex = 0;
      }

      const paginatedData = allTexts.slice(startIndex, startIndex + parseInt(limit));
      const nextCursor = paginatedData.length === parseInt(limit) ? paginatedData[paginatedData.length - 1].id : null;

      return res.status(200).json({ data: paginatedData, nextCursor, total: allTexts.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    try {
      const textData = req.body;
      const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
      const cleanContent = DOMPurify.sanitize(textData.content || "", {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'u'],
      }).trim();

      const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "manuscrit";
      const id = `${slug}-${Date.now()}`;
      const path = `data/publications/${id}.json`;
      const creationDate = new Date().toISOString();

      const securedData = { ...textData, id, title: cleanTitle, content: cleanContent, date: creationDate };

      // 1. Sauvegarde du texte complet sur GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📖 Publication : ${cleanTitle}`,
          content: Buffer.from(JSON.stringify(securedData, null, 2)).toString("base64"),
        }),
      });

      if (!response.ok) throw new Error("Erreur stockage GitHub (Vérifiez votre Token ou le dossier)");

      // 2. Mise à jour de l'INDEX global
      const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
      const indexFetch = await fetch(indexUrl, { headers: { Authorization: `Bearer ${token}` } });
      let indexContent = [];
      let indexSha = null;

      if (indexFetch.ok) {
        const indexData = await indexFetch.json();
        indexSha = indexData.sha;
        indexContent = JSON.parse(Buffer.from(indexData.content, "base64").toString("utf-8"));
      }

      indexContent.unshift({
        id,
        title: cleanTitle,
        authorName: textData.authorName,
        authorEmail: textData.authorEmail,
        date: creationDate,
        isConcours: textData.isConcours,
        genre: textData.genre,
        imageBase64: textData.imageBase64 ? "exists" : null 
      });

      await fetch(indexUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "🗂 Index Update",
          content: Buffer.from(JSON.stringify(indexContent.slice(0, 5000), null, 2)).toString("base64"),
          sha: indexSha
        }),
      });

      // 3. Notifications aux abonnés (Non-bloquant)
      const host = req.headers.host;
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const origin = `${protocol}://${host}`;
      
      const authorIdentifier = textData.authorEmail.toLowerCase().trim().replace(/[.@]/g, '_');
      const authorProfilePath = `data/users/${authorIdentifier}.json`;

      fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${authorProfilePath}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(userDataFile => {
        const userData = JSON.parse(Buffer.from(userDataFile.content, "base64").toString("utf-8"));
        if (userData.subscribers?.length > 0) {
          userData.subscribers.forEach(subEmail => {
            fetch(`${origin}/api/create-notif`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                targetEmail: subEmail,
                type: "new_publication",
                message: `${textData.authorName || "Une plume"} a publié : "${cleanTitle}"`,
                link: `/texts/${id}`
              })
            }).catch(() => null);
          });
        }
      }).catch(() => null);

      return res.status(200).json({ success: true, id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message || "Échec de publication" });
    }
  }

  // --- LOGIQUE PATCH (Likes/Views) ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    if (!id) return res.status(400).json({ error: "ID manquant" });

    if (action === "like" || action === "view") {
      try {
        const key = action === "like" ? `likes:${id}` : `views:${id}`;
        const redisRes = await fetch(`${redisUrl}/incr/${key}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
        const data = await redisRes.json();
        return res.status(200).json({ success: true, count: data.result });
      } catch (e) {
        return res.status(500).json({ error: "Redis Error" });
      }
    }

    const textPath = `data/publications/${id}.json`;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!getRes.ok) throw new Error("Texte introuvable.");
      const fileData = await getRes.json();
      let textData = JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      
      const host = req.headers.host;
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const origin = `${protocol}://${host}`;

      if (action === "certify") {
        textData.totalCertified = (textData.totalCertified || 0) + 1;
        await fetch(`${origin}/api/wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: textData.authorEmail, amount: 1, reason: `Certification : ${textData.title}`, type: "reward", isConcours: textData.isConcours || false })
        });
        await fetch(`${origin}/api/create-notif`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetEmail: textData.authorEmail, type: "certified_read", message: `Nouveau sceau sur "${textData.title}" !`, amountLi: 1 })
        });
      }

      if (action === "comment") {
        if (!textData.comments) textData.comments = [];
        textData.comments.push({
          userName: payload.userName || "Une plume",
          text: DOMPurify.sanitize(payload.text, { ALLOWED_TAGS: [] }).trim(),
          date: new Date().toISOString()
        });
      }

      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${textPath}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📊 Update [${action}] : ${textData.title}`,
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

// CONFIGURATION CRITIQUE POUR LES IMAGES LOURDES
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};
