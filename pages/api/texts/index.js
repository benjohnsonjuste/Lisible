import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { title, content, authorName, imageBase64 } = req.body;

    if (!title || !content || !authorName) {
      return res.status(400).json({
        error: "Champs requis manquants",
      });
    }

    // 📁 dossier data
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    const filePath = path.join(dataDir, "texts.json");

    // 📖 lecture existante
    let texts = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      texts = raw ? JSON.parse(raw) : [];
    }

    const id = Date.now().toString();

    // 🖼️ gestion image
    let imageUrl = null;
    if (imageBase64) {
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Image invalide" });
      }

      const ext = matches[1].split("/")[1];
      const buffer = Buffer.from(matches[2], "base64");

      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const imageName = `${id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, imageName), buffer);
      imageUrl = `/uploads/${imageName}`;
    }

    const newText = {
      id,
      title,
      content,
      authorName,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    texts.unshift(newText);

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

    // ✅ RÉPONSE JSON OBLIGATOIRE
    return res.status(200).json({
      success: true,
      text: newText,
    });
  } catch (err) {
    console.error("API /texts error:", err);
    return res.status(500).json({
      error: "Erreur interne serveur",
    });
  }
}