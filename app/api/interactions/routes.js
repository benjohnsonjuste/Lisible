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
      body: JSON.stringify({ message: `[DB-UPDATE] ${message} [skip ci]`, content: encoded, sha: sha || undefined }),
    });
    return res.ok;
  } catch (err) { return false; }
}

// --- ROUTE PRINCIPALE ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, textId, userEmail, userName, userPic, comment, authorEmail, textTitle, isPodcast } = body;
    
    // On harmonise l'ID (certains composants envoient 'id', d'autres 'textId')
    const contentId = id || textId;
    if (!contentId || !action) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

    // Empreinte unique (IP + UA + ID + Action)
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'unknown';
    const deviceFingerprint = createHash('md5').update(`${ip}-${ua}-${contentId}-${action}`).digest('hex');

    // 1. DÉTERMINER LE CHEMIN DU CONTENU
    // Si c'est un podcast ou marqué comme tel, on va dans podcasts.json, sinon dans le dossier texts
    const targetPath = (isPodcast || contentId.startsWith('pod_')) 
      ? `data/podcasts.json` 
      : `data/texts/${contentId}.json`;

    const fileMeta = await getFile(targetPath);
    if (!fileMeta) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 });

    // 2. EXTRAIRE L'OBJET CIBLE (Podcasts = tableau, Textes = objet racine)
    let targetObject = null;
    if (targetPath.endsWith('podcasts.json')) {
      if (!Array.isArray(fileMeta.content)) fileMeta.content = [];
      targetObject = fileMeta.content.find(p => p.id === contentId);
    } else {
      targetObject = fileMeta.content;
    }

    if (!targetObject) return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });

    // 3. TRAITEMENT DES ACTIONS
    
    // --- ACTION : COMMENTAIRE ---
    if (action === "comment") {
      if (!targetObject.comments) targetObject.comments = [];
      const newComment = {
        userName: userName || "Plume",
        userEmail: userEmail,
        userPic: userPic,
        text: comment,
        date: new Date().toISOString()
      };
      targetObject.comments.push(newComment);
    } 
    
    // --- ACTION : LIKE / CERTIFY / VIEW ---
    else {
      if (!targetObject.interactions) targetObject.interactions = [];
      
      // Vérifier si l'appareil a déjà fait cette action (sauf pour les vues)
      if (action !== 'view' && targetObject.interactions.includes(deviceFingerprint)) {
        return NextResponse.json({ success: true, alreadyDone: true });
      }

      if (action === 'toggle_like' || action === 'like') targetObject.likes = (targetObject.likes || 0) + 1;
      if (action === 'certify_content' || action === 'certify') targetObject.certified = (targetObject.certified || 0) + 1;
      if (action === 'view') targetObject.views = (targetObject.views || 0) + 1;

      if (action !== 'view') targetObject.interactions.push(deviceFingerprint);
    }

    // 4. SAUVEGARDE DU CONTENU (Texte ou Podcast)
    await updateFile(targetPath, fileMeta.content, fileMeta.sha, `${action} sur ${contentId}`);

    // 5. NOTIFICATION & TRANSFERT DE LI À L'AUTEUR
    if (authorEmail && authorEmail.toLowerCase() !== userEmail?.toLowerCase()) {
      const authorPath = getSafePath(authorEmail);
      const authorFile = await getFile(authorPath);

      if (authorFile) {
        if (!authorFile.content.notifications) authorFile.content.notifications = [];
        
        let notifMessage = "";
        if (action === "comment") notifMessage = `${userName} a commenté "${textTitle || 'votre œuvre'}"`;
        if (action.includes("like")) notifMessage = `Nouveau coup de cœur sur "${textTitle || 'votre œuvre'}"`;
        if (action.includes("certify")) {
          notifMessage = `Sceau apposé sur "${textTitle || 'votre œuvre'}". +1 Li reçu !`;
          authorFile.content.li = (authorFile.content.li || 0) + 1; // Gain de Li
        }

        if (notifMessage) {
          authorFile.content.notifications.unshift({
            id: `notif_${Date.now()}`,
            type: action,
            message: notifMessage,
            date: new Date().toISOString(),
            read: false
          });
          await updateFile(authorPath, authorFile.content, authorFile.sha, `Notif/Reward for ${action}`);
        }
      }
    }

    // 6. SYNC INDEX (Uniquement pour les textes)
    if (!targetPath.endsWith('podcasts.json')) {
      const indexPath = `data/publications/index.json`;
      const indexFile = await getFile(indexPath);
      if (indexFile && Array.isArray(indexFile.content)) {
        const idx = indexFile.content.findIndex(item => item.id === contentId);
        if (idx > -1) {
          indexFile.content[idx].likes = targetObject.likes;
          indexFile.content[idx].certified = targetObject.certified;
          indexFile.content[idx].views = targetObject.views || 0;
          await updateFile(indexPath, indexFile.content, indexFile.sha, `Sync Index`);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
