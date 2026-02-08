import { NextResponse } from "next/server";
import mongoose from "mongoose";

// 1. Gestion de la connexion (Stable pour Vercel)
const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) throw new Error("La variable MONGODB_URI est absente des réglages Vercel.");
  return mongoose.connect(MONGODB_URI);
}

// 2. Modèle Unique (Identique pour tout le site)
const TextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: "Poésie" },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  imageBase64: { type: String }, // L'image est stockée ici en texte
  isConcours: { type: Boolean, default: false },
  concurrentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 }
});

// On récupère le modèle existant ou on en crée un nouveau
const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

// --- FONCTION DE PUBLICATION ---
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    
    // On nettoie les données reçues
    const payload = {
      title: body.title,
      content: body.content,
      category: body.category,
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      imageBase64: body.imageBase64,
      isConcours: body.isConcours || false,
      concurrentId: body.concurrentId ? body.concurrentId.toUpperCase() : null,
    };

    // Création dans MongoDB
    const newText = await Text.create(payload);

    return NextResponse.json({ 
      success: true, 
      id: newText._id,
      message: "L'œuvre a rejoint la bibliothèque." 
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur MongoDB:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de l'enregistrement",
      details: error.message 
    }, { status: 500 });
  }
}
