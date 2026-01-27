import { Buffer } from "buffer";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const branch = "main";

  if (!token) {
    return res.status(500).json({ error: "Le jeton GitHub n'est pas configuré." });
  }

  // --- 1. CRÉATION D'UN TEXTE ---
  if (req.method === "POST") {
    const { title, content, authorName, authorEmail, imageBase64, date } = req.body;
    
    const timestamp = Date.now();
    // Création d'un slug propre pour le nom du fichier
    const slug = title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève les accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    const fileName = `${timestamp}-${slug}`;
    const path = `data/publications/${fileName}.json`;

    const textData = { 
      id: fileName, 
      title, 
      content, 
      authorName, 
      authorEmail, // Important pour les futures notifications
      date: date || new Date().toISOString(), 
      imageBase64: imageBase64 || null, 
      views: 0, 
      likes: [], 
      comments: [] 
    };

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `📚 Nouveau texte : ${title}`,
          content: Buffer.from(JSON.stringify(textData, null, 2)).toString("base64"),
          branch
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Erreur lors de l'upload GitHub");
      }

      return res.status(201).json({ id: fileName });
    } catch (e) { 
      return res.status(500).json({ error: e.message }); 
    }
  }

  // --- 2. MODIFICATION (Vues, Likes, Commentaires) ---
  if (req.method === "PATCH") {
    const { id, action, payload } = req.body;
    const path = `data/publications/${id}.json`;

    try {
      // Récupérer le fichier actuel avec le SHA (obligatoire pour PUT update)
      const getFile = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!getFile.ok) return res.status(404).json({ error: "Texte introuvable" });

      const fileInfo = await getFile.json();
      // Décodage UTF-8 sécurisé
      let data = JSON.parse(Buffer.from(fileInfo.content, "base64").toString("utf-8"));

      // Logique des actions
      if (action === "view") {
        data.views = (data.views || 0) + 1;
      }
      
      if (action === "like") {
        if (!data.likes) data.likes = [];
        data.likes = data.likes.includes(payload.email) 
          ? data.likes.filter(e => e !== payload.email) 
          : [...data.likes, payload.email];
      }
      
      if (action === "comment") {
        if (!data.comments) data.comments = [];
        data.comments.push({ 
          userName: payload.userName, 
          text: payload.text, 
          date: new Date().toISOString() 
        });
      }

      // Renvoyer le fichier modifié vers GitHub
      const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `✨ interaction : ${action} sur ${data.title}`,
          content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
          sha: fileInfo.sha, // Très important pour la mise à jour
          branch
        }),
      });

      if (!updateResponse.ok) throw new Error("Échec de la mise à jour GitHub");

      return res.status(200).json(data);
    } catch (e) { 
      return res.status(500).json({ error: e.message }); 
    }
  }

  return res.status(405).json({ message: "Méthode non autorisée" });
}
