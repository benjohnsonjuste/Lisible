import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export const config = {
  api: { 
    bodyParser: { sizeLimit: '10mb' },
    externalResolver: true, // Aide Next.js à gérer les promesses asynchrones longues
  },
};

export default async function handler(req, res) {
  // Ajout des headers de base
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- LOGIQUE GET ---
  if (req.method === "GET") {
    // ... (votre code GET actuel est correct)
  }

  // --- LOGIQUE POST ---
  if (req.method === "POST") {
    try {
      const textData = req.body;
      
      // Validation plus souple pour éviter les rejets inutiles
      if (!textData || !textData.content) {
        return res.status(400).json({ error: "Le contenu du manuscrit est requis." });
      }

      const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
      const cleanContent = DOMPurify.sanitize(textData.content || ""); 
      
      const slug = cleanTitle.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-").slice(0, 30) || "manuscrit";
      
      const id = `${slug}-${Date.now()}`;
      const creationDate = new Date().toISOString();

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
        category: textData.category || "Littérature",
        imageBase64: textData.imageBase64 || null 
      };

      // 1. Sauvegarde du fichier texte
      const path = `data/texts/${id}.json`;
      const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `token ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          message: `📖 Publication : ${cleanTitle}`,
          content: Buffer.from(JSON.stringify(securedData), "utf-8").toString("base64"),
        }),
      });

      if (!fileResponse.ok) {
        const errBody = await fileResponse.text();
        console.error("GitHub Error:", errBody);
        throw new Error("Impossible de sauvegarder le fichier sur GitHub.");
      }

      // 2. Mise à jour de l'index
      const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
      const indexFetch = await fetch(`${indexUrl}?t=${Date.now()}`, { 
        headers: { Authorization: `token ${token}` }
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
        authorName: textData.authorName || "Plume",
        authorEmail: textData.authorEmail?.toLowerCase().trim(),
        date: creationDate,
        genre: securedData.category,
        content: cleanContent.substring(0, 200),
        hasImage: !!textData.imageBase64
      };

      indexContent.unshift(newEntry);

      const updateRes = await fetch(indexUrl, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "🗂 Index Update",
          content: Buffer.from(JSON.stringify(indexContent.slice(0, 1000)), "utf-8").toString("base64"),
          sha: indexSha
        }),
      });

      return res.status(200).json({ success: true, id });

    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Si on arrive ici, c'est que la méthode n'est ni GET ni POST
  return res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
}
