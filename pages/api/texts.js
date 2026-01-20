import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "texts.json");

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!fs.existsSync(filePath)) {
        return res.status(200).json([]);
      }

      const texts = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return res.status(200).json(texts);
    }

    if (req.method === "POST") {
      const { title, content, authorName } = req.body;

      if (!title || !content || !authorName) {
        return res.status(400).json({ error: "Champs manquants" });
      }

      const texts = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, "utf8"))
        : [];

      const newText = {
        id: Date.now().toString(),
        title,
        content,
        authorName,
        createdAt: new Date().toISOString(),
      };

      texts.unshift(newText);
      fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

      return res.status(201).json(newText);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}