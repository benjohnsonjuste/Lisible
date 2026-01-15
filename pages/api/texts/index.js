import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "texts.json");

export default function handler(req, res) {
  const texts = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (req.method === "GET") {
    return res.status(200).json(texts);
  }

  if (req.method === "POST") {
    const { title, content, authorName, authorId, imageUrl } = req.body;

    if (!title || !content || !authorName) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    const newText = {
      id: Date.now().toString(),
      title,
      content,
      imageUrl: imageUrl || "",
      authorName,
      authorId,
      createdAt: Date.now(),
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      likes: [],
      viewsBy: [],
      comments: []
    };

    texts.push(newText);
    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

    return res.status(201).json(newText);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}