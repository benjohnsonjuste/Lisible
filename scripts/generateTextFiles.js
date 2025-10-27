import fs from "fs";
import path from "path";

// Chemin vers index.json
const indexPath = path.join(process.cwd(), "public/data/texts/index.json");
// Dossier où créer les fichiers individuels
const textsDir = path.join(process.cwd(), "public/data/texts");

// Chemin vers l'image placeholder
const placeholderImage = "/default-placeholder.png";

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(textsDir)) fs.mkdirSync(textsDir, { recursive: true });

// Lit le fichier index.json
const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

// Pour chaque texte, créer un fichier {id}.json
indexData.forEach((text) => {
  const textFile = {
    id: text.id,
    title: text.title || "Titre inconnu",
    authorName: text.authorName || "Auteur inconnu",
    authorId: text.authorId || null,
    date: text.date || new Date().toISOString(),
    content: text.content || "",
    image: text.image || placeholderImage,
  };

  const filePath = path.join(textsDir, `${text.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(textFile, null, 2));
  console.log(`✅ Fichier créé: ${filePath}`);
});

console.log("Tous les fichiers texte ont été générés avec images placeholder si nécessaire !");
