import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function POST(req) {
  try {
    const data = await req.json();
    const { title, content, authorEmail, penName, isConcours, category } = data;

    // 1. Générer un ID unique et un nom de fichier propre
    const id = Buffer.from(`${title}-${Date.now()}`).toString('base64').substring(0, 12).replace(/\//g, '_');
    const publicationPath = `data/publications/${id}.json`;
    const indexPath = `data/index.json`;

    const newPublication = {
      id,
      title,
      content,
      authorEmail,
      penName,
      category: category || "Uncategorized",
      isConcours: isConcours || false,
      createdAt: new Date().toISOString(),
      stats: { views: 0, likes: 0, comments: [] },
      certified: data.authorRole === 'verified'
    };

    // --- ÉTAPE 1 : Créer le fichier de la publication ---
    const createRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${publicationPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `🚀 New Publication: ${title}`,
        content: Buffer.from(JSON.stringify(newPublication, null, 2)).toString('base64'),
      }),
    });

    if (!createRes.ok) throw new Error("Failed to create publication file");

    // --- ÉTAPE 2 : Mettre à jour l'index central (Registry) ---
    // On doit d'abord lire l'index actuel pour récupérer son SHA et son contenu
    const getIndex = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }
    });

    if (getIndex.ok) {
      const indexFileData = await getIndex.json();
      const currentCards = JSON.parse(Buffer.from(indexFileData.content, 'base64').toString('utf-8'));
      
      // On ajoute la version courte pour l'affichage de la bibliothèque
      const newIndexEntry = {
        id,
        title,
        author: penName,
        authorEmail,
        category: newPublication.category,
        isConcours: newPublication.isConcours,
        createdAt: newPublication.createdAt
      };

      currentCards.push(newIndexEntry);

      // On repousse l'index mis à jour
      await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${indexPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `📝 Update Index: added ${title}`,
          content: Buffer.from(JSON.stringify(currentCards, null, 2)).toString('base64'),
          sha: indexFileData.sha // Crucial pour la mise à jour
        }),
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("GitHub API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
