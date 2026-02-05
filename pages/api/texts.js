import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  // --- LOGIQUE DE LECTURE (GET) POUR LA BIBLIOTHÈQUE ---
  if (req.method === "GET") {
    try {
      const { limit = 12, lastId } = req.query;
      const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json?t=${Date.now()}`;
      
      const response = await fetch(indexUrl, { headers: { Authorization: `token ${token}` } });
      if (!response.ok) return res.status(200).json({ data: [], nextCursor: null });

      const indexData = await response.json();
      const allTexts = JSON.parse(Buffer.from(indexData.content, "base64").toString("utf-8"));

      let startIndex = 0;
      if (lastId) {
        startIndex = allTexts.findIndex(t => t.id === lastId) + 1;
      }

      const paginatedData = allTexts.slice(startIndex, startIndex + parseInt(limit));
      const nextCursor = allTexts.length > startIndex + parseInt(limit) 
        ? paginatedData[paginatedData.length - 1].id 
        : null;

      return res.status(200).json({ data: paginatedData, nextCursor });
    } catch (e) {
      return res.status(500).json({ error: "Erreur lecture index" });
    }
  }

  // --- LOGIQUE DE PUBLICATION (POST) ---
  if (req.method === "POST") {
    try {
      const textData = req.body;
      if (!textData?.content) return res.status(400).json({ error: "Manuscrit vide." });

      const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
      const cleanContent = DOMPurify.sanitize(textData.content || "", {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'u', 'h1', 'h2'],
      }).trim();

      const slug = cleanTitle.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-").slice(0, 30) || "manuscrit";
      const id = `${slug}-${Date.now()}`;
      const creationDate = new Date().toISOString();

      // Initialisation des compteurs à zéro pour éviter les "NaN" ou "undefined"
      const securedData = { 
        ...textData, 
        id, 
        title: cleanTitle, 
        content: cleanContent, 
        date: creationDate,
        views: 0,
        totalLikes: 0,
        totalCertified: 0,
        comments: [],
        category: textData.category || textData.genre || "Littérature",
        imageBase64: textData.imageBase64 || null 
      };

      // 1. Sauvegarde du fichier complet
      const path = `data/texts/${id}.json`;
      const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📖 Publication : ${cleanTitle}`,
          content: Buffer.from(JSON.stringify(securedData, null, 2), "utf-8").toString("base64"),
        }),
      });

      if (!fileResponse.ok) throw new Error("Erreur stockage fichier.");

      // 2. Mise à jour de l'index global (avec logique de retry)
      const updateIndex = async (attempts = 3) => {
        const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
        const indexFetch = await fetch(`${indexUrl}?t=${Date.now()}`, { 
          headers: { Authorization: `token ${token}` }, cache: 'no-store' 
        });
        
        let indexContent = [];
        let indexSha = null;
        if (indexFetch.ok) {
          const indexRes = await indexFetch.json();
          indexSha = indexRes.sha;
          indexContent = JSON.parse(Buffer.from(indexRes.content, "base64").toString("utf-8"));
        }

        const newEntry = {
          id,
          title: cleanTitle,
          authorName: textData.authorName,
          authorEmail: textData.authorEmail?.toLowerCase().trim(),
          date: creationDate,
          genre: securedData.category,
          content: cleanContent.substring(0, 300),
          hasImage: !!textData.imageBase64,
          views: 0,
          totalLikes: 0
        };

        indexContent.unshift(newEntry);

        const updateRes = await fetch(indexUrl, {
          method: "PUT",
          headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "🗂 Index Update",
            content: Buffer.from(JSON.stringify(indexContent.slice(0, 2000), null, 2), "utf-8").toString("base64"),
            sha: indexSha
          }),
        });

        if (!updateRes.ok && attempts > 0) return updateIndex(attempts - 1);
        if (!updateRes.ok) throw new Error("Index Error");
      };

      await updateIndex();
      return res.status(200).json({ success: true, id });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
