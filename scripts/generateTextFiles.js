// scripts/generateTextFiles.js
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ⚡ Configuration Firebase (remplace par la tienne)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chemins
const indexPath = path.join(process.cwd(), "public/data/texts/index.json");
const textsDir = path.join(process.cwd(), "public/data/texts");
const placeholderImage = "/default-placeholder.png";

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(textsDir)) fs.mkdirSync(textsDir, { recursive: true });

// Lit index.json
const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

// Fonction pour récupérer le nom exact de l'auteur
async function getAuthorName(authorId) {
  if (!authorId) return "Auteur inconnu";

  try {
    const userRef = doc(db, "users", authorId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.name || userData.email?.split("@")[0] || "Auteur inconnu";
    }
  } catch (err) {
    console.error(`Erreur récupération auteur ${authorId}:`, err);
  }

  return "Auteur inconnu";
}

// Génère tous les fichiers
async function generateFiles() {
  for (const text of indexData) {
    const authorName = await getAuthorName(text.authorId);

    const textFile = {
      id: text.id,
      title: text.title || "Titre inconnu",
      authorName,
      authorId: text.authorId || null,
      date: text.date || new Date().toISOString(),
      content: text.content || "",
      image: text.image || placeholderImage,
    };

    const filePath = path.join(textsDir, `${text.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(textFile, null, 2));
    console.log(`✅ Fichier créé: ${filePath}`);
  }

  console.log("✅ Tous les fichiers textes ont été générés !");
}

// Exécution
generateFiles();