import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "texts.json");

export default function handler(req, res) {
  try {
    // 🔒 S'assurer que le dossier data existe
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // 📖 Lire les textes existants
    const texts = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : [];

    // ➕ PUBLIER UN TEXTE
    if (req.method === "POST") {
      const { title, content, authorName, imageBase64 } = req.body;

      if (!title || !content || !authorName) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      const newText = {
        id: Date.now().toString(),
        title,
        content,
        authorName,
        imageBase64: imageBase64 || null, // ✅ image encodée
        createdAt: new Date().toISOString()
      };

      texts.unshift(newText);

      fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

      return res.status(201).json(newText);
    }

    // 📚 LISTER LES TEXTES
    if (req.method === "GET") {
      return res.status(200).json(texts);
    }

    return res.status(405).json({ error: "Méthode non autorisée" });

  } catch (error) {
    console.error("API /texts ERROR:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}