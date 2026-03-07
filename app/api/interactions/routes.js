import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS CORE ---

const getSafePath = (email) => {
  if (!email) return null;
  return `data/users/${email.toLowerCase().trim().replace(/@/g, '_').replace(/\./g, '_').replace(/[^a-z0-9_]/g, '')}.json`;
};

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Lisible-App' },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (m) => m.codePointAt(0)));
    return { content: JSON.parse(decoded), sha: data.sha };
  } catch (err) { return null; }
}

async function updateFile(path, content, sha, message) {
  const encoded = btoa(Array.from(new TextEncoder().encode(JSON.stringify(content, null, 2)), (byte) => String.fromCodePoint(byte)).join(""));
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json', 'User-Agent': 'Lisible-App' },
      body: JSON.stringify({ message: `[UNIQUE-INT] ${message} [skip ci]`, content: encoded, sha: sha || undefined }),
    });
    return res.ok;
  } catch (err) { return false; }
}

// --- ROUTE PRINCIPALE ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, action, userEmail, authorEmail } = body;

    // Empreinte unique : IP + UserAgent + ID du contenu + Type d'action
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'unknown';
    const deviceFingerprint = createHash('md5').update(`${ip}-${ua}-${id}-${action}`).digest('hex');

    if (!id || !action) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

    const isPodcast = id.startsWith('pod_');
    let targetPath = isPodcast ? `data/podcasts.json` : `data/texts/${id}.json`;
    let contentData = null;
    let fileMeta = await getFile(targetPath);

    if (!fileMeta) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 });

    // 1. EXTRACTION DE L'OBJET À MODIFIER
    let targetObject = null;
    if (isPodcast) {
      // Pour les podcasts, on cherche l'objet dans le tableau
      const pods = Array.isArray(fileMeta.content) ? fileMeta.content : [];
      targetObject = pods.find(p => p.id === id);
    } else {
      // Pour les textes, c'est l'objet racine du fichier
      targetObject = fileMeta.content;
    }

    if (!targetObject) return NextResponse.json({ error: "Podcast non trouvé dans la liste" }, { status: 404 });

    // 2. VÉRIFICATION DE L'UNICITÉ
    if (!targetObject.interactions) targetObject.interactions = [];
    if (targetObject.interactions.includes(deviceFingerprint) && action !== 'view') {
      return NextResponse.json({ 
        error: "Déjà effectué", 
        alreadyDone: true,
        count: action === 'like' ? targetObject.likes : targetObject.certified 
      }, { status: 200 });
    }

    // 3. MISE À JOUR DES COMPTEURS
    if (action === 'like') targetObject.likes = (targetObject.likes || 0) + 1;
    if (action === 'certify') targetObject.certified = (targetObject.certified || 0) + 1;
    if (action === 'view') targetObject.views = (targetObject.views || 0) + 1;
    
    if (action !== 'view') targetObject.interactions.push(deviceFingerprint);

    // 4. SAUVEGARDE DU FICHIER SOURCE
    await updateFile(targetPath, fileMeta.content, fileMeta.sha, `${action} unique sur ${id}`);

    // 5. SYNC INDEX (Seulement pour les textes, car les podcasts utilisent déjà un fichier central)
    if (!isPodcast) {
      const indexPath = `data/publications/index.json`;
      const indexFile = await getFile(indexPath);
      if (indexFile && Array.isArray(indexFile.content)) {
        const idx = indexFile.content.findIndex(item => item.id === id);
        if (idx > -1) {
          indexFile.content[idx].likes = targetObject.likes;
          indexFile.content[idx].certified = targetObject.certified;
          indexFile.content[idx].views = targetObject.views || 0;
          await updateFile(indexPath, indexFile.content, indexFile.sha, `Sync Index`);
        }
      }
    }

    // 6. NOTIFICATION & RÉCOMPENSE
    if (authorEmail && authorEmail.toLowerCase() !== userEmail?.toLowerCase()) {
      const authorPath = getSafePath(authorEmail);
      const authorFile = await getFile(authorPath);
      if (authorFile) {
        if (!authorFile.content.notifications) authorFile.content.notifications = [];
        authorFile.content.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: action,
          message: `Nouveau ${action} sur "${targetObject.title}" !`,
          date: new Date().toISOString(),
          read: false
        });
        if (action === 'certify') authorFile.content.li = (authorFile.content.li || 0) + 1;
        await updateFile(authorPath, authorFile.content, authorFile.sha, `Reward Unique`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: action === 'like' ? targetObject.likes : (action === 'certify' ? targetObject.certified : targetObject.views) 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
