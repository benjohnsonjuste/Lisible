import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder'); 

  if (!folder) {
    return NextResponse.json({ error: "Spécifiez un dossier (folder)" }, { status: 400 });
  }

  try {
    // 1. Récupérer la liste des fichiers avec désactivation stricte du cache
    const listRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/${folder}`,
      {
        headers: { 
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        // Force Next.js à ne pas mettre en cache cette route API
        cache: 'no-store'
      }
    );

    if (!listRes.ok) return NextResponse.json({ content: [] });

    const files = await listRes.json();
    
    // 2. Lire le contenu de chaque fichier JSON en parallèle
    const dataPromises = files
      .filter(file => file.name.endsWith('.json'))
      .map(async (file) => {
        try {
          // On ajoute un timestamp unique à l'URL de téléchargement pour bypasser le CDN GitHub si nécessaire
          const nocacheUrl = `${file.download_url}?t=${Date.now()}`;
          const fileRes = await fetch(nocacheUrl, { cache: 'no-store' });
          if (!fileRes.ok) return null;
          return await fileRes.json();
        } catch { return null; }
      });

    const results = await Promise.all(dataPromises);
    
    // 3. Retourner les données propres
    const cleanResults = results.filter(r => r !== null);

    return NextResponse.json({ 
      folder: folder,
      total: cleanResults.length,
      content: cleanResults 
    }, {
      // Headers de réponse pour empêcher le navigateur de mettre en cache la liste
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
