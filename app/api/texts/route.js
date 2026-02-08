import { NextResponse } from "next/server";
import mongoose from "mongoose";

// --- CONFIGURATION MONGODB ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Veuillez définir la variable MONGODB_URI dans votre fichier .env");
}

/**
 * Connexion à la base de données (Singleton pattern pour Next.js)
 */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --- MODÈLE DE DONNÉES (Schema) ---
// On définit le modèle ici pour éviter les erreurs de compilation Next.js
const TextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "Poésie" },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  imageBase64: { type: String }, // Stockage simple de l'image
  isConcours: { type: Boolean, default: false },
  concurrentId: { type: String },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Array, default: [] },
  views: { type: Number, default: 0 }
});

// Empêche la re-déclaration du modèle lors du Hot Reload
const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

// --- HANDLER POST ---
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { 
      title, 
      content, 
      category, 
      authorName, 
      authorEmail, 
      imageBase64, 
      isConcours, 
      concurrentId 
    } = body;

    // Validation basique côté serveur
    if (!title || !content || !authorEmail) {
      return NextResponse.json(
        { error: "Données manquantes (titre, contenu ou email)." },
        { status: 400 }
      );
    }

    // Création de l'entrée en base de données
    const newText = await Text.create({
      title,
      content,
      category,
      authorName,
      authorEmail,
      imageBase64,
      isConcours,
      concurrentId: concurrentId ? concurrentId.toUpperCase() : null,
    });

    // Réponse de succès
    return NextResponse.json({
      success: true,
      message: "Œuvre enregistrée avec succès",
      id: newText._id
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur API Texts:", error);
    
    // On renvoie TOUJOURS du JSON, même en cas d'erreur
    return NextResponse.json({ 
      success: false,
      error: "Erreur interne du serveur lors de la publication.",
      details: error.message 
    }, { status: 500 });
  }
}

// --- HANDLER GET (Optionnel : pour lister les textes) ---
export async function GET() {
  try {
    await dbConnect();
    const texts = await Text.find({}).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json(texts);
  } catch (error) {
    return NextResponse.json({ error: "Impossible de récupérer les textes" }, { status: 500 });
  }
}
