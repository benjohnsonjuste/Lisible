// app/texts/[id]/page.js

import React from "react";
import { notFound } from "next/navigation";
import TextPageClient from "./TextPageClient";

// 1. Récupération des données (Côté Serveur)
async function getFullData(id) {
  try {
    // Récupérer le texte spécifique
    const res = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;

    const fileData = await res.json();
    const initialText = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

    // Récupérer l'index pour les recommandations
    const indexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`,
      { next: { revalidate: 3600 } }
    );
    
    let allTexts = [];
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      allTexts = JSON.parse(decodeURIComponent(escape(atob(indexData.content))));
    }

    return { initialText, allTexts };
  } catch (e) {
    console.error("Fetch error:", e);
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

// Optionnel: Générer les chemins statiques pour les performances au build
export async function generateStaticParams() {
  return [];
}
