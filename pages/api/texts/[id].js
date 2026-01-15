import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "texts.json");

export default function handler(req, res) {
  const texts = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { id } = req.query;
  const text = texts.find(t => t.id === id);

  if (!text) return res.status(404).json({ message: "Texte non trouvé" });

  if (req.method === "GET") {
    return res.status(200).json(text);
  }

  if (req.method === "POST") {
    const { type } = req.query;

    // Ajouter commentaire
    if (type === "comment") {
      const { authorName, authorId, message } = req.body;
      if (!message || !authorName) {
        return res.status(400).json({ message: "Message et nom obligatoires." });
      }

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

    // Ajouter Like unique
    if (type === "like") {
      const { authorId } = req.body;
      if (!authorId) return res.status(400).json({ message: "ID utilisateur obligatoire" });

      if (!text.likes.includes(authorId)) {
        text.likes.push(authorId);
        text.likesCount = text.likes.length;
        fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
      }
      return res.status(200).json({ likesCount: text.likesCount });
    }

    // Ajouter vue unique
    if (type === "view") {
      const { authorId } = req.body;
      if (!authorId) return res.status(400).json({ message: "ID utilisateur obligatoire" });

      if (!text.viewsBy.includes(authorId)) {
        text.viewsBy.push(authorId);
        text.views = text.viewsBy.length;
        fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));
      }
      return res.status(200).json({ views: text.views });
    }

    return res.status(400).json({ message: "Type non reconnu" });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}