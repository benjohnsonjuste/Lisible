import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Connexion à MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Modèle (doit être identique à celui de api/texts)
const TextSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  authorName: String,
  authorEmail: String,
  imageBase64: String,
  createdAt: { type: Date, default: Date.now },
});

const Text = mongoose.models.Text || mongoose.model("Text", TextSchema);

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    // Pagination
    const limit = parseInt(searchParams.get("limit")) || 10;
    const lastDate = searchParams.get("cursor"); // On utilise la date pour le curseur

    let query = {};
    if (lastDate) {
      query = { createdAt: { $lt: new Date(lastDate) } };
    }

    // Récupérer les textes depuis MongoDB
    const texts = await Text.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const nextCursor = texts.length === limit ? texts[texts.length - 1].createdAt : null;

    return NextResponse.json({
      data: texts,
      nextCursor,
      total: await Text.countDocuments()
    }, { status: 200 });

  } catch (e) {
    console.error("Erreur de récupération MongoDB:", e);
    return NextResponse.json({ error: "Erreur de chargement des données" }, { status: 500 });
  }
}
