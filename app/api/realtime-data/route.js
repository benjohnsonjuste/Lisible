import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder'); // 'users', 'texts', ou 'publications'

  if (!folder) {
    return NextResponse.json({ error: "Spécifiez un dossier (folder)" }, { status: 400 });
  }

  try {
    // 1. Récupérer la liste des fichiers dans le dossier spécifié
    const listRes = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/${folder}`,
      {
        headers: { 
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github.v3+json' 
        },
        next: { revalidate: 0 } // Force le temps réel (pas de cache)
      }
    );

    if (!listRes.ok) return NextResponse.json({ content: [] });

    const files = await listRes.json();
    
    // 2. Lire le contenu de chaque fichier JSON en parallèle
    const dataPromises = files
      .filter(file => file.name.endsWith('.json'))
      .map(async (file) => {
        try {
          const fileRes = await fetch(file.download_url, { cache: 'no-store' });
          if (!fileRes.ok) return null;
          return await fileRes.json();
        } catch { return null; }
      });

    const results = await Promise.all(dataPromises);
    
    // 3. Retourner les données propres (sans les erreurs de lecture)
    return NextResponse.json({ 
      folder: folder,
      total: results.filter(r => r !== null).length,
      content: results.filter(r => r !== null) 
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
