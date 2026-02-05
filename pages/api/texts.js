import { Buffer } from "buffer";
import DOMPurify from "isomorphic-dompurify";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const textData = req.body;
    
    if (!textData || !textData.content) {
      return res.status(400).json({ error: "Le contenu du manuscrit est vide." });
    }

    // Nettoyage des données
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
      imageBase64: textData.imageBase64 || null 
    };

    // 1. Sauvegarde du fichier JSON de l'œuvre
    const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { 
        Authorization: `Bearer ${token}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `📖 Publication : ${cleanTitle}`,
        content: Buffer.from(JSON.stringify(securedData, null, 2)).toString("base64"),
      }),
    });

    if (!fileResponse.ok) {
      const errGitHub = await fileResponse.json();
      throw new Error(`Erreur lors de la création du fichier: ${errGitHub.message}`);
    }

    // 2. Mise à jour de l'INDEX avec système anti-conflit (Retry)
    const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
    
    const updateIndex = async (attempts = 3) => {
      // Récupération fraîche du SHA et du contenu
      const indexFetch = await fetch(indexUrl, { 
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store' 
      });
      
      let indexContent = [];
      let indexSha = null;

      if (indexFetch.ok) {
        const indexData = await indexFetch.json();
        indexSha = indexData.sha;
        indexContent = JSON.parse(Buffer.from(indexData.content, "base64").toString("utf-8"));
      }

      // Ajout de la nouvelle entrée en haut de liste
      const newEntry = {
        id,
        title: cleanTitle,
        authorName: textData.authorName,
        authorEmail: textData.authorEmail,
        date: creationDate,
        isConcours: !!textData.isConcours,
        genre: textData.genre || "Littérature",
        hasImage: !!textData.imageBase64 
      };

      indexContent.unshift(newEntry);

      const updateRes = await fetch(indexUrl, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "🗂 Index Update",
          content: Buffer.from(JSON.stringify(indexContent.slice(0, 5000), null, 2)).toString("base64"),
          sha: indexSha
        }),
      });

      if (!updateRes.ok) {
        if (attempts > 0) {
          // Si conflit de SHA (409), on réessaye après une courte pause
          await new Promise(resolve => setTimeout(resolve, 1000));
          return updateIndex(attempts - 1);
        }
        const errIndex = await updateRes.json();
        throw new Error(`Erreur Index: ${errIndex.message}`);
      }
      return true;
    };

    await updateIndex();

    return res.status(200).json({ success: true, id });

  } catch (error) {
    console.error("Erreur API complète:", error);
    return res.status(500).json({ error: error.message || "Échec de publication" });
  }
}
