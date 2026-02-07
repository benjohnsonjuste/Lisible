// scripts/generateTextFiles.js
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ⚡ Configuration Firebase (Variables d'environnement recommandées)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Chemins absolus
const textsDir = path.resolve(process.cwd(), "data/publications");
const indexPath = path.resolve(textsDir, "index.json");
const placeholderImage = "/default-placeholder.png";

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(textsDir)) {
  fs.mkdirSync(textsDir, { recursive: true });
}

/**
 * Récupère le nom de l'auteur depuis Firestore
 */
async function getAuthorName(authorId) {
  if (!authorId) return "Auteur inconnu";

  try {
    const userRef = doc(db, "users", authorId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Priorité au nom d'auteur, puis pseudo, puis début de l'email
      return userData.penName || userData.name || userData.email?.split("@")[0] || "Auteur inconnu";
    }
  } catch (err) {
    console.error(`Erreur récupération auteur ${authorId}:`, err);
  }

  return "Auteur inconnu";
}

/**
 * Génère les fichiers JSON individuels à partir de l'index global
 */
async function generateFiles() {
  try {
    if (!fs.existsSync(indexPath)) {
      console.error("❌ index.json introuvable à l'adresse :", indexPath);
      return;
    }

    const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

    for (const text of indexData) {
      if (!text.id) continue;

      const authorName = await getAuthorName(text.authorId);

      const textFile = {
        id: text.id,
        title: text.title || "Titre inconnu",
        penName: authorName, // Unifié avec ta nouvelle structure
        authorId: text.authorId || null,
        date: text.date || new Date().toISOString(),
        content: text.content || "",
        category: text.category || "Inconnue",
        image: text.image || placeholderImage,
        stats: {
          views: text.views || 0,
          likes: text.totalLikes || 0,
          certified: text.totalCertified || 0
        }
      };

      const filePath = path.join(textsDir, `${text.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(textFile, null, 2));
      console.log(`✅ Fichier synchronisé : ${text.id}.json`);
    }

    console.log("\n🚀 Tous les fichiers individuels ont été générés avec succès !");
  } catch (error) {
    console.error("🔴 Erreur lors de la génération :", error);
  }
}

// Lancement
generateFiles();
