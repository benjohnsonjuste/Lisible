import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';

const localCache = new Map();
const CACHE_TTL = 0; 

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

const ECONOMY = {
  MIN_TRANSFER: 1000,
  WITHDRAWAL_THRESHOLD: 25000, 
  REQUIRED_FOLLOWERS: 250,      
  LI_VALUE_USD: 0.0002 
};

// --- HELPERS CORE ---

async function getFile(path) {
  const now = Date.now();
  const cached = localCache.get(path);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lisible-App'
      },
      cache: 'no-store'
    });
    
    if (res.status === 404) return null;
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.content) return null;
    
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    
    const result = { content: JSON.parse(decodedContent), sha: data.sha };
    if (CACHE_TTL > 0) localCache.set(path, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.error(`Fetch error [${path}]:`, err.message);
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  localCache.delete(path);
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encodedContent = btoa(binString);

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'Lisible-App'
      },
      body: JSON.stringify({
        message: `[DATA] ${message} [skip ci]`,
        content: encodedContent,
        sha: sha || undefined
      }),
    });
    return res.ok;
  } catch (err) {
    console.error(`Update error [${path}]:`, err.message);
    return false;
  }
}

const getSafePath = (email) => {
  if (!email) return null;
  const safeEmail = email.toLowerCase().trim()
    .replace(/@/g, '_')
    .replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return `data/users/${safeEmail}.json`;
};

const globalSort = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const certA = Number(a?.certified || a?.totalCertified || 0);
    const certB = Number(b?.certified || b?.totalCertified || 0);
    if (certB !== certA) return certB - certA;
    const likesA = Number(a?.likes || a?.totalLikes || 0);
    const likesB = Number(b?.likes || b?.totalLikes || 0);
    if (likesB !== likesA) return likesB - likesA;
    const dateA = a?.date ? new Date(a.date).getTime() : 0;
    const dateB = b?.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

// --- ROUTES ---

export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const body = await req.json();
    const { action, userEmail, textId, duelId, amount, adminToken, ...data } = body;
    
    const emailToUse = userEmail || data.email;
    const targetPath = getSafePath(emailToUse);

    if (action === 'register') {
      const file = await getFile(targetPath);
      if (file) return NextResponse.json({ error: "Ce compte existe déjà" }, { status: 400 });
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(data.password, salt);
      const userData = {
        email: data.email.toLowerCase().trim(),
        name: data.name || "Nouvel Auteur",
        li: data.referralCode ? 250 : 50,
        status: "active",
        notifications: [], followers: [], following: [], works: [],
        bookmarks: [],
        created_at: new Date().toISOString(),
        ...data,
        password: hashedPassword 
      };
      await updateFile(targetPath, userData, null, `👤 User Register: ${data.email}`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'login') {
      let file = await getFile(targetPath);
      if (!file) {
        const legacyPath = `data/users/${emailToUse.toLowerCase().trim().replace(/@/g, '_')}.json`;
        file = await getFile(legacyPath);
      }
      if (!file) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
      if (file.content.status === "deleted") {
        return NextResponse.json({ error: "Compte en attente de suppression." }, { status: 403 });
      }
      const isMatch = bcrypt.compareSync(data.password, file.content.password);
      if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const newPub = { ...data, id: pubId, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const indexFile = await getFile(indexPath) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, category: data.category, genre: data.genre, image: data.image, date: newPub.date, views: 0, likes: 0, certified: 0 });
      indexContent = globalSort(indexContent);
      await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update`);
      return NextResponse.json({ success: true, id: pubId });
    }

    if (action === 'delete_text') {
      const idToDelete = textId || data.textId;
      const isPodcast = idToDelete.startsWith('pod_');
      const path = isPodcast ? `data/podcasts/${idToDelete}.json` : `data/texts/${idToDelete}.json`;
      const indexPath = isPodcast ? `data/podcasts/index.json` : `data/publications/index.json`;
      
      const file = await getFile(path);
      if (file) {
        await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `🗑 Delete: ${idToDelete}`, sha: file.sha })
        });
      }
      const indexFile = await getFile(indexPath);
      if (indexFile && Array.isArray(indexFile.content)) {
        const newIndex = indexFile.content.filter(t => t.id !== idToDelete);
        await updateFile(indexPath, newIndex, indexFile.sha, `🔄 Index Sync Delete`);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'transfer_li') {
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (!sender || !receiver || sender.content.li < amount) return NextResponse.json({ error: "Transaction impossible" }, { status: 400 });
      sender.content.li -= amount;
      receiver.content.li += amount;
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received Li`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  try {
    if (type === 'text') {
        const text = await getFile(`data/texts/${id}.json`);
        return NextResponse.json(text);
    }
    if (type === 'user') {
        const user = await getFile(getSafePath(id));
        if (user) delete user.content.password;
        return NextResponse.json(user);
    }
    if (type === 'publications') {
      const index = await getFile(`data/publications/index.json`);
      if (index) index.content = globalSort(index.content);
      return NextResponse.json(index);
    }
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, action, notifId } = body;

    if (action === 'mark_read') {
      const userPath = getSafePath(id);
      const userFile = await getFile(userPath);
      if (!userFile) return NextResponse.json({ error: "404" }, { status: 404 });
      userFile.content.notifications = (userFile.content.notifications || []).map(n => n.id === notifId ? { ...n, read: true } : n);
      await updateFile(userPath, userFile.content, userFile.sha, `🔕 Notif read`);
      return NextResponse.json({ success: true });
    }

    const isPodcast = id.startsWith('pod_');
    const contentPath = isPodcast ? `data/podcasts/${id}.json` : `data/texts/${id}.json`;
    const indexPath = isPodcast ? `data/podcasts/index.json` : `data/publications/index.json`;

    const contentFile = await getFile(contentPath);
    if (!contentFile) return NextResponse.json({ error: "404" }, { status: 404 });

    if (action === 'view') contentFile.content.views = (contentFile.content.views || 0) + 1;
    if (action === 'like') contentFile.content.likes = (contentFile.content.likes || 0) + 1;

    const indexFile = await getFile(indexPath);
    if (indexFile && Array.isArray(indexFile.content)) {
      const idx = indexFile.content.findIndex(t => t.id === id);
      if (idx > -1) {
        indexFile.content[idx].views = contentFile.content.views;
        indexFile.content[idx].likes = contentFile.content.likes;
        await updateFile(indexPath, indexFile.content, indexFile.sha, `🔄 Index Sync`);
      }
    }

    await updateFile(contentPath, contentFile.content, contentFile.sha, `📈 Stat Update`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
