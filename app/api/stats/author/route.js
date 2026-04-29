import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
  }

  try {
    // Chemin vers le fichier JSON des publications
    const filePath = path.join(process.cwd(), 'data', 'publications', 'texts.json');
    
    // Lecture du fichier
    const fileData = await fs.readFile(filePath, 'utf8');
    const publications = JSON.parse(fileData);

    // Initialisation des compteurs
    let stats = {
      totalViews: 0,
      totalLikes: 0,
      totalCertified: 0,
      textCount: 0,
    };

    // Filtrage et calcul des données de l'auteur
    publications.forEach((item) => {
      if (item.authorEmail === email) {
        stats.totalViews += (item.views || 0);
        stats.totalLikes += (item.likes || 0);
        stats.totalCertified += (item.certified || 0);
        stats.textCount += 1;
      }
    });

    return NextResponse.json({
      success: true,
      authorEmail: email,
      stats: stats
    });

  } catch (error) {
    console.error("Erreur calcul stats auteur:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Impossible de récupérer les statistiques" 
    }, { status: 500 });
  }
}
