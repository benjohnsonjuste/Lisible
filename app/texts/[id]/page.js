import React from "react";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import TextPageClient from "./TextPageClient";

// Modèle de données (doit correspondre à tes autres routes)
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

// 1. Récupération des données (Côté Serveur) via MongoDB
async function getFullData(id) {
  try {
    // Connexion à la base de données
    if (mongoose.connection.readyState >= 1) {
      // Déjà connecté
    } else {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Récupérer le texte spécifique par son ID MongoDB
    // On utilise .lean() pour obtenir un objet JS pur (plus léger pour Next.js)
    const work = await Text.findById(id).lean();
    if (!work) return null;

    // Récupérer tous les textes pour les recommandations (limité aux 50 derniers pour la performance)
    const allTexts = await Text.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select('title authorName category createdAt') // On ne prend que le nécessaire
      .lean();

    // Sécurisation des données pour le passage du Serveur au Client (JSON serializable)
    return { 
      initialText: JSON.parse(JSON.stringify(work)), 
      allTexts: JSON.parse(JSON.stringify(allTexts)) 
    };
  } catch (e) {
    console.error("MongoDB Fetch error:", e);
    return null;
  }
}

// 2. Le point d'entrée (Server Component)
export default async function Page({ params }) {
  const data = await getFullData(params.id);

  if (!data) {
    notFound();
  }

  return (
    <TextPageClient 
      initialText={data.initialText} 
      id={params.id} 
      allTexts={data.allTexts} 
    />
  );
}

// Forcer le rendu dynamique pour toujours avoir les derniers likes/vues
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}
