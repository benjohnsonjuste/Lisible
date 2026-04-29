import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "L'email de l'auteur est requis" }, { status: 400 });
  }

  try {
    // Chemin vers le fichier JSON source
    const filePath = path.join(process.cwd(), 'data', 'publications', 'texts.json');
    
    // Lecture sécurisée du fichier
    const fileData = await fs.readFile(filePath, 'utf8');
    const allPublications = JSON.parse(fileData);

    // Filtrage pour ne récupérer que les textes de l'auteur
    // On ne retourne que les champs nécessaires pour le dashboard (optimisation)
    const authorTexts = allPublications
      .filter(item => item.authorEmail?.toLowerCase().trim() === email)
      .map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        date: item.date,
        views: item.views || 0,
        certified: item.certified || 0,
        isPremium: item.isPremium || false
      }))
      // Tri du plus récent au plus ancien
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      success: true,
      count: authorTexts.length,
      publications: authorTexts
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des textes de l'auteur:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de l'accès aux données de publication" 
    }, { status: 500 });
  }
}
