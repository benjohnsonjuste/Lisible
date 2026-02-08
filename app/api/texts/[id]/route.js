import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Définition du schéma (doit être identique à tes autres routes)
const TextSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  authorName: String,
  authorEmail: String,
  imageBase64: String,
  isConcours: Boolean,
  concurrentId: String,
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  comments: { type: Array, default: [] }
});

const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

// GET : Récupérer un texte spécifique par son ID
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const work = await Text.findById(id).lean();

    if (!work) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 });
    }

    return NextResponse.json(work, { status: 200 });
  } catch (error) {
    console.error("Erreur GET spécifique:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE : (Optionnel) Pour permettre aux admins ou auteurs de supprimer
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    // Ajoute ici une vérification d'auth si nécessaire
    await Text.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Supprimé avec succès" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
