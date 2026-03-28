import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// Helper pour récupérer la liste des fichiers d'un dossier
async function getDirectoryFiles(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
    cache: 'no-store'
  });
  return res.ok ? await res.json() : [];
}

// Helper pour lire un fichier spécifique
async function getFileContent(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json();
  const decoded = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (m) => m.codePointAt(0)));
  return JSON.parse(decoded);
}

export async function GET(req) {
  // Sécurité simple via l'URL (ex: /api/rebuild-index?pw=ton_mot_de_passe_admin)
  const { searchParams } = new URL(req.url);
  if (searchParams.get('pw') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 });
  }

  try {
    // 1. Lister tous les fichiers dans data/texts/
    const files = await getDirectoryFiles('data/texts');
    const newIndex = [];

    // 2. Extraire les métadonnées de chaque texte
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        const content = await getFileContent(file.url);
        if (content) {
          newIndex.push({
            id: content.id,
            title: content.title,
            author: content.authorName || content.author,
            authorEmail: content.authorEmail,
            category: content.category,
            genre: content.genre || "",
            isConcours: content.isConcours || false,
            image: content.image || null,
            date: content.date,
            views: content.views || 0,
            likes: content.likes || 0,
            certified: content.certified || 0
          });
        }
      }
    }

    // 3. Trier (Sceaux > Likes > Date)
    newIndex.sort((a, b) => {
      if (b.certified !== a.certified) return b.certified - a.certified;
      if (b.likes !== a.likes) return b.likes - a.likes;
      return new Date(b.date) - new Date(a.date);
    });

    // 4. Sauvegarder l'index sur GitHub
    const indexPath = 'data/publications/index.json';
    const existingIndex = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
        headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }
    }).then(r => r.json());

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(newIndex, null, 2))));
    
    await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "🔧 Rebuild Index [skip ci]",
        content: encoded,
        sha: existingIndex.sha
      }),
    });

    return NextResponse.json({ success: true, count: newIndex.length });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
