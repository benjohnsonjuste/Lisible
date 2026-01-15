import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "texts.json");

export default function handler(req, res) {
  // Lire tous les textes
  const texts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { id } = req.query;
  const text = texts.find(t => t.id === id);

  if (!text) return res.status(404).json({ error: "Texte non trouvé" });

  // GET → récupérer le texte
  if (req.method === "GET") {
    return res.status(200).json(text);
  }

  // POST → ajouter un commentaire
  if (req.method === "POST") {
    const { authorName, authorId, message } = req.body;
    if (!authorName || !authorId || !message) {
      return res.status(400).json({ error: "Informations manquantes" });
    }

    const comment = {
      id: Date.now().toString(),
      authorName,
      authorId,
      message,
      createdAt: Date.now()
    };

    text.comments = text.comments || [];
    text.comments.push(comment);
    text.commentsCount = text.comments.length;

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
    return res.status(201).json(comment);
  }

  // PATCH → mise à jour likes ou vues
  if (req.method === "PATCH") {
    const { likesCount, views } = req.body;
    let updated = false;

    if (typeof likesCount === "number") {
      text.likesCount = likesCount;
      updated = true;
    }

    if (typeof views === "number") {
      text.views = views;
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ error: "Aucune donnée valide fournie" });
    }

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
    return res.status(200).json(text);
  }

  res.setHeader("Allow", ["GET", "POST", "PATCH"]);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}