// pages/api/texts.js

import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "texts.json");

// ✅ S’assurer que le dossier et le fichier existent
function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

export default function handler(req, res) {
  ensureDataFile();

  const texts = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // =========================
  // 📖 LECTURE : bibliothèque
  // =========================
  if (req.method === "GET") {
    return res.status(200).json(texts);
  }

  // =========================
  // ✍️ CRÉATION : publication
  // =========================
  if (req.method === "POST") {
    const { title, content, authorName, imageBase64 } = req.body;

    // 🔒 Validation minimale
    if (!title || !content || !authorName) {
      return res.status(400).json({
        error: "Titre, contenu et nom de l’auteur sont requis",
      });
    }

    const newText = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim(),
      imageBase64: imageBase64 || null,

      createdAt: Date.now(),

      // Compteurs
      views: 0,
      likes: 0,
      commentsCount: 0,

      // Données associées
      comments: [],
      likedBy: [],        // Like unique par appareil/utilisateur
      viewedBy: [],       // Vue unique
    };

    texts.unshift(newText); // 🔥 le plus récent en premier

    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

    return res.status(201).json(newText);
  }

  // =========================
  // ❌ MÉTHODE NON AUTORISÉE
  // =========================
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Méthode non autorisée" });
}