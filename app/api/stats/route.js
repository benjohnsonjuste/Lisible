import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data');
    
    const paths = {
      texts: path.join(dataPath, 'texts'),
      users: path.join(dataPath, 'users'),
      publications: path.join(dataPath, 'publications'),
      // Optionnel : chemin vers un fichier de tracking global si existant
      analytics: path.join(dataPath, 'analytics.json') 
    };

    // 1. Lecture des répertoires pour les totaux de base
    const [textsFiles, usersFiles] = await Promise.all([
      fs.readdir(paths.texts).catch(() => []),
      fs.readdir(paths.users).catch(() => [])
    ]);

    let totalPageViews = 0;
    let totalUniqueLikes = 0;
    let certifiedCount = 0;

    // 2. Analyse profonde des textes (pour les pages vues cumulées)
    const textsContents = await Promise.all(
      textsFiles
        .filter(f => f.endsWith('.json'))
        .map(f => fs.readFile(path.join(paths.texts, f), 'utf-8'))
    );

    textsContents.forEach(content => {
      const text = JSON.parse(content);
      // On considère que chaque "vue" sur un texte contribue aux pages vues totales
      totalPageViews += Number(text.views || 0);
      totalUniqueLikes += Number(text.likes || 0);
      if (text.certified || text.totalCertified) certifiedCount++;
    });

    // 3. Simulation/Récupération des Visiteurs Uniques
    // Note : Dans un système de fichiers, le nombre de visiteurs est souvent corrélé 
    // soit à une table de logs, soit estimé via le nombre d'utilisateurs + un facteur de trafic.
    let totalVisitors = 0;
    try {
      const analyticsRaw = await fs.readFile(paths.analytics, 'utf-8');
      const analytics = JSON.parse(analyticsRaw);
      totalVisitors = analytics.totalUniqueVisitors || 0;
    } catch {
      // Si pas de fichier analytics, estimation basée sur l'activité (Vues / 2.5)
      totalVisitors = Math.floor(totalPageViews / 2.5) + usersFiles.length;
    }

    return NextResponse.json({
      success: true,
      metrics: {
        // Nombre d'utilisateurs inscrits
        registeredUsers: usersFiles.length,
        
        // Nombre de textes publiés
        publishedTexts: textsFiles.length,
        
        // Nombre de visiteurs uniques (estimés ou réels)
        uniqueVisitors: totalVisitors,
        
        // Nombre de pages vues (cumul des vues textes + navigation)
        pageViews: totalPageViews,
        
        // Data additionnelle
        engagement: {
          likes: totalUniqueLikes,
          certified: certifiedCount
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur de traitement des données" },
      { status: 500 }
    );
  }
}
