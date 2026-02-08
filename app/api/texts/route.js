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
  imageBase64: { type: String }, 
  isConcours: { type: Boolean, default: false },
  concurrentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 }
});

const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

// --- FONCTION DE PUBLICATION ---
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    
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

    const newText = await Text.create(payload);

    return NextResponse.json({ 
      success: true, 
      id: newText._id,
      message: "L'œuvre a rejoint la bibliothèque." 
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur MongoDB POST:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de l'enregistrement",
      details: error.message 
    }, { status: 500 });
  }
}

// --- FONCTION DE MISE À JOUR (LIKES) ---
export async function PATCH(req) {
  try {
    await dbConnect();
    const { id, action } = await req.json();

    if (action === "like") {
      const updatedText = await Text.findByIdAndUpdate(
        id,
        { $inc: { likes: 1 } }, // Incrémente de 1
        { new: true }
      );

      return NextResponse.json({ 
        success: true, 
        count: updatedText.likes 
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });

  } catch (error) {
    console.error("Erreur MongoDB PATCH:", error.message);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
