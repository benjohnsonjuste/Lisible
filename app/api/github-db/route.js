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
  LI_VALUE_USD: 0.0002 
};

// --- HELPERS CORE ---

async function getFile(path) {
  const now = Date.now();
  if (CACHE_TTL > 0) {
    const cached = localCache.get(path);
    if (cached && (now - cached.timestamp < CACHE_TTL)) return cached.data;
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
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!data.content) return null;
    
    // DECODAGE UTF-8 ROBUSTE
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    
    const result = { content: JSON.parse(decodedContent), sha: data.sha };
    if (CACHE_TTL > 0) localCache.set(path, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.error("Error getFile:", err);
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  localCache.delete(path);
  try {
    const jsonString = JSON.stringify(content, null, 2);
    // ENCODAGE UTF-8 ROBUSTE
    const bytes = new TextEncoder().encode(jsonString);
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const encodedContent = btoa(binString);

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
    console.error("Error updateFile:", err);
    return false;
  }
}

const getSafePath = (email) => {
  if (!email) return null;
  return `data/users/${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}.json`;
};

const globalSort = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const certA = Number(a?.certified || 0);
    const certB = Number(b?.certified || 0);
    if (certB !== certA) return certB - certA;
    const likesA = Number(a?.likes || 0);
    const likesB = Number(b?.likes || 0);
    if (likesB !== likesA) return likesB - likesA;
    return new Date(b?.date || 0) - new Date(a?.date || 0);
  });
};

// --- ROUTES ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userEmail, ...data } = body;
    const targetPath = getSafePath(userEmail || data.email);

    if (action === 'register') {
      const file = await getFile(targetPath);
      if (file) return NextResponse.json({ error: "Compte existant" }, { status: 400 });
      const hashedPassword = bcrypt.hashSync(data.password.trim(), bcrypt.genSaltSync(10));
      const userData = {
        ...data,
        email: data.email.toLowerCase().trim(),
        li: data.referralCode ? 250 : 50,
        notifications: [], followers: [], following: [], works: [],
        created_at: new Date().toISOString(),
        password: hashedPassword 
      };
      await updateFile(targetPath, userData, null, `Register: ${data.email}`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'login') {
      const file = await getFile(targetPath);
      if (!file) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
      const isMatch = bcrypt.compareSync(data.password.trim(), file.content.password);
      if (!isMatch) return NextResponse.json({ error: "Invalide" }, { status: 401 });
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const isConcours = data.isConcours === true || data.genre === "Battle Poétique";
      const newPub = { 
        ...data, id: pubId, isConcours, date: new Date().toISOString(), 
        views: 0, likes: 0, comments: [], certified: 0
      };
      await updateFile(`data/texts/${pubId}.json`, newPub, null, `Publish: ${data.title}`);
      
      const indexFile = await getFile(`data/publications/index.json`) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ 
        id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, 
        category: data.category, genre: data.genre, isConcours, image: data.image, 
        date: newPub.date, views: 0, likes: 0, certified: 0
      });
      await updateFile(`data/publications/index.json`, globalSort(indexContent), indexFile.sha, `Index Update`);
      return NextResponse.json({ success: true, id: pubId });
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
      const file = await getFile(`data/texts/${id}.json`);
      if (!file) return NextResponse.json({ error: "404" }, { status: 404 });
      return NextResponse.json(file); // Renvoie { content, sha }
    }

    if (type === 'user') {
      const file = await getFile(getSafePath(id));
      if (!file) return NextResponse.json({ error: "404" }, { status: 404 });
      file.content.li_usd_value = (file.content.li * ECONOMY.LI_VALUE_USD).toFixed(2);
      delete file.content.password;
      return NextResponse.json(file);
    }

    if (type === 'library' || type === 'publications') {
      const file = await getFile(`data/publications/index.json`);
      if (file && Array.isArray(file.content)) {
        file.content = globalSort(file.content);
        return NextResponse.json(file);
      }
      return NextResponse.json({ content: [] });
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const textFile = await getFile(`data/texts/${id}.json`);
    if (!textFile) return NextResponse.json({ error: "404" }, { status: 404 });

    // Mise à jour de la métrique
    const key = action === 'view' ? 'views' : action === 'like' ? 'likes' : 'certified';
    textFile.content[key] = (textFile.content[key] || 0) + 1;

    // Sync Index
    const indexFile = await getFile(`data/publications/index.json`);
    if (indexFile && Array.isArray(indexFile.content)) {
      const idx = indexFile.content.findIndex(t => t.id === id);
      if (idx > -1) {
        indexFile.content[idx][key] = textFile.content[key];
        await updateFile(`data/publications/index.json`, indexFile.content, indexFile.sha, `Sync ${action}`);
      }
    }

    await updateFile(`data/texts/${id}.json`, textFile.content, textFile.sha, `Update ${action}`);
    return NextResponse.json({ success: true, count: textFile.content[key] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
