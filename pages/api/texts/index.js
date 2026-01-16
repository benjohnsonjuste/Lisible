import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { title, content, authorName } = req.body;

    if (!title || !content || !authorName) {
      return res.status(400).json({
        error: "Champs requis manquants"
      });
    }

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "texts.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    let texts = [];
    if (fs.existsSync(filePath)) {
      texts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const newText = {
      id: Date.now(),
      title,
      content,
      authorName,
      createdAt: new Date().toISOString()
    };

    texts.unshift(newText);
    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

    return res.status(200).json({
      success: true,
      text: newText
    });

  } catch (err) {
    console.error("API /texts error:", err);
    return res.status(500).json({
      error: "Erreur serveur"
    });
  }
}