import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (req.method === "POST") {
    try {
      const textData = req.body;
      
      // Sécurité : Vérifier que le body n'est pas vide
      if (!textData || !textData.content) {
        return res.status(400).json({ error: "Le contenu du manuscrit est vide." });
      }

      const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
      const cleanContent = DOMPurify.sanitize(textData.content || "", {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'u'],
      }).trim();

      const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "manuscrit";
      const id = `${slug}-${Date.now()}`;
      const path = `data/publications/${id}.json`;
      const creationDate = new Date().toISOString();

      const securedData = { 
        ...textData, 
        id, 
        title: cleanTitle, 
        content: cleanContent, 
        date: creationDate,
        imageBase64: textData.imageBase64 || null // Gère proprement l'absence d'image
      };

      // 1. Sauvegarde sur GitHub
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `📖 Publication : ${cleanTitle}`,
          content: Buffer.from(JSON.stringify(securedData, null, 2)).toString("base64"),
        }),
      });

      if (!response.ok) {
        const errGitHub = await response.json();
        throw new Error(`GitHub Error: ${errGitHub.message}`);
      }

      // 2. Mise à jour de l'INDEX
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
        isConcours: textData.isConcours || false,
        genre: textData.genre || "Littérature",
        hasImage: !!textData.imageBase64 
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

      return res.status(200).json({ success: true, id });

    } catch (error) {
      console.error("Erreur API:", error);
      return res.status(500).json({ error: error.message || "Échec de publication" });
    }
  }

  // Autres méthodes (GET, PATCH) restent identiques...
  return res.status(405).json({ error: "Méthode non autorisée" });
}

// CETTE CONFIGURATION DOIT ÊTRE PRÉSENTE
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};
