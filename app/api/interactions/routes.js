import { NextResponse } from 'next/server';

// On réutilise les configurations de ton fichier principal
const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// Helper interne pour récupérer un fichier (identique à ton architecture)
async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (m) => m.codePointAt(0))));
    return { content: decoded, sha: data.sha };
  } catch { return null; }
}

// Helper interne pour mettre à jour
async function updateFile(path, content, sha, message) {
  const encoded = btoa(new TextEncoder().encode(JSON.stringify(content, null, 2)).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `[INTERACTION] ${message}`, content: encoded, sha })
  });
  return res.ok;
}

export async function POST(req) {
  try {
    const { id, action, userEmail, authorEmail } = await req.json();

    if (!id || !action) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

    const isPodcast = id.startsWith('pod_');
    const contentPath = isPodcast ? `data/podcasts/${id}.json` : `data/texts/${id}.json`;
    const indexPath = isPodcast ? `data/podcasts/index.json` : `data/publications/index.json`;

    // 1. MISE À JOUR DU CONTENU (Le fichier individuel)
    const file = await getFile(contentPath);
    if (!file) return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });

    if (action === 'like') file.content.likes = (file.content.likes || 0) + 1;
    if (action === 'certify') file.content.certified = (file.content.certified || 0) + 1;
    
    await updateFile(contentPath, file.content, file.sha, `${action} sur ${id}`);

    // 2. SYNCHRONISATION DE L'INDEX
    const indexFile = await getFile(indexPath);
    if (indexFile && Array.isArray(indexFile.content)) {
      const idx = indexFile.content.findIndex(item => item.id === id);
      if (idx > -1) {
        indexFile.content[idx].likes = file.content.likes;
        indexFile.content[idx].certified = file.content.certified;
        await updateFile(indexPath, indexFile.content, indexFile.sha, `Sync Index ${action}`);
      }
    }

    // 3. NOTIFICATION DE L'AUTEUR (Optionnel mais recommandé)
    if (authorEmail && authorEmail !== userEmail) {
      const safeAuthorEmail = authorEmail.toLowerCase().trim().replace(/@/g, '_').replace(/\./g, '_');
      const authorPath = `data/users/${safeAuthorEmail}.json`;
      const authorFile = await getFile(authorPath);
      
      if (authorFile) {
        const newNotif = {
          id: `notif_${Date.now()}`,
          type: action,
          message: `Votre podcast "${file.content.title}" a reçu un ${action} !`,
          date: new Date().toISOString(),
          read: false
        };
        authorFile.content.notifications = [newNotif, ...(authorFile.content.notifications || [])];
        await updateFile(authorPath, authorFile.content, authorFile.sha, `Notif ${action} pour auteur`);
      }
    }

    return NextResponse.json({ success: true, count: action === 'like' ? file.content.likes : file.content.certified });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
