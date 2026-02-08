import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Récupération du modèle Text (doit correspondre à ton schéma)
const TextSchema = new mongoose.Schema({
  views: { type: Number, default: 0 }
});
const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

export async function POST(req) {
  try {
    await dbConnect();
    const { textId } = await req.json();

    if (!textId) {
      return NextResponse.json({ error: "textId requis" }, { status: 400 });
    }

    // Incrémentation atomique du champ "views" dans MongoDB
    const updatedText = await Text.findByIdAndUpdate(
      textId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedText) {
      return NextResponse.json({ error: "Texte non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      views: updatedText.views,
      source: "mongodb_atomic" 
    }, { status: 200 });

  } catch (e) {
    console.error("MongoDB Tracking Error:", e);
    return NextResponse.json(
      { error: "Tracking Error", details: e.message }, 
      { status: 500 }
    );
  }
}
