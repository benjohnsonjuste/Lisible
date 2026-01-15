import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "texts.json");

export default function handler(req, res) {
  const texts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { id } = req.query;
  const text = texts.find(t => t.id === id);

  if (!text) return res.status(404).json({ error: "Texte non trouvé" });

  // GET → récupérer texte
  if (req.method === "GET") {
    return res.status(200).json(text);
  }

  // PATCH → vues ou likes
  if (req.method === "PATCH") {
    const { views, likesCount } = req.body;

    if (typeof views === "number") text.views = views;
    if (typeof likesCount === "number") text.likesCount = likesCount;

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
    return res.status(200).json(text);
  }

  // POST → commentaire
  if (req.method === "POST") {
    const { authorName, authorId, message } = req.body;
    if (!authorName || !authorId || !message)
      return res.status(400).json({ error: "Informations manquantes" });

    const comment = {
      id: Date.now().toString(),
      authorName,
      authorId,
      message,
      createdAt: Date.now()
    };

    text.comments.push(comment);
    text.commentsCount = text.comments.length;

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
    return res.status(201).json(comment);
  }

  res.setHeader("Allow", ["GET", "PATCH", "POST"]);
  res.status(405).end(`Méthode ${req.method} non autorisée`);
}