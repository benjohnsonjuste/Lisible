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

    // 1. NETTOYAGE RIGOUREUX
    const cleanTitle = DOMPurify.sanitize(textData.title || "Sans titre", { ALLOWED_TAGS: [] }).trim();
    const cleanContent = DOMPurify.sanitize(textData.content || "", {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'u', 'h1', 'h2'],
    }).trim();

    const slug = cleanTitle.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève les accents pour l'URL
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30) || "manuscrit";
      
    const id = `${slug}-${Date.now()}`;
    
    // CORRECTION DU CHEMIN : data/texts/ pour le contenu complet
    const path = `data/texts/${id}.json`;
    const creationDate = new Date().toISOString();

    const securedData = { 
      ...textData, 
      id, 
      title: cleanTitle, 
      content: cleanContent, 
      date: creationDate,
      category: textData.category || textData.genre || "Littérature",
      imageBase64: textData.imageBase64 || null 
    };

    // 2. SAUVEGARDE DU FICHIER COMPLET
    const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { 
        Authorization: `token ${token}`, // Utilisation de token au lieu de Bearer
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `📖 Publication : ${cleanTitle}`,
        content: Buffer.from(JSON.stringify(securedData, null, 2), "utf-8").toString("base64"),
      }),
    });

    if (!fileResponse.ok) {
      const errGitHub = await fileResponse.json();
      throw new Error(`GitHub File Error: ${errGitHub.message}`);
    }

    // 3. MISE À JOUR DE L'INDEX GLOBAL
    const indexUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/publications/index.json`;
    
    const updateIndex = async (attempts = 3) => {
      const indexFetch = await fetch(`${indexUrl}?t=${Date.now()}`, { 
        headers: { Authorization: `token ${token}` },
        cache: 'no-store' 
      });
      
      let indexContent = [];
      let indexSha = null;

      if (indexFetch.ok) {
        const indexData = await indexFetch.json();
        indexSha = indexData.sha;
        indexContent = JSON.parse(Buffer.from(indexData.content, "base64").toString("utf-8"));
      }

      const newEntry = {
        id,
        title: cleanTitle,
        authorName: textData.authorName,
        authorEmail: textData.authorEmail?.toLowerCase().trim(),
        date: creationDate,
        genre: textData.category || textData.genre || "Littérature",
        // On stocke un extrait pour la bibliothèque
        content: cleanContent.substring(0, 300),
        image: textData.imageBase64 ? true : false
      };

      indexContent.unshift(newEntry);

      const updateRes = await fetch(indexUrl, {
        method: "PUT",
        headers: { 
          Authorization: `token ${token}`, 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "🗂 Index Update",
          content: Buffer.from(JSON.stringify(indexContent.slice(0, 2000), null, 2), "utf-8").toString("base64"),
          sha: indexSha
        }),
      });

      if (!updateRes.ok) {
        if (attempts > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return updateIndex(attempts - 1);
        }
        throw new Error("Échec de la mise à jour de l'index.");
      }
      return true;
    };

    await updateIndex();

    return res.status(200).json({ success: true, id });

  } catch (error) {
    console.error("ERREUR PUBLICATION:", error);
    return res.status(500).json({ error: error.message });
  }
}
