import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Cache de 60s pour soulager GitHub des lectures répétées
const localCache = new NodeCache({ stdTTL: 60 });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS GITHUB ---

async function getFile(path) {
  const cached = localCache.get(path);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lisible-App'
      },
      cache: 'no-store'
    });

    if (res.status === 429) throw new Error("THROTTLED");
    if (!res.ok) return null;

    const data = await res.json();
    const result = { 
      content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')), 
      sha: data.sha 
    };

    localCache.set(path, result);
    return result;
  } catch (err) {
    console.error(`Erreur sur ${path}:`, err.message);
    return err.message === "THROTTLED" ? { error: "THROTTLED" } : null;
  }
}

async function updateFile(path, content, sha, message) {
  localCache.del(path); // On vide le cache lors d'une mise à jour
  
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
      'Content-Type': 'application/json',
      'User-Agent': 'Lisible-App'
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha: sha || undefined
    }),
  });
  return res.ok;
}

const getSafePath = (email) => `data/users/${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

// --- MÉTHODE POST (Actions & Créations) ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userEmail, textId, amount, ...data } = body;

    // Actions Utilisateurs
    if (action === 'user_sync') {
      const path = getSafePath(userEmail);
      const file = await getFile(path);
      const userData = file?.content ? { ...file.content, ...data } : { 
        email: userEmail, ...data, li: 50, notifications: [], followers: [], following: [], created_at: new Date().toISOString() 
      };
      await updateFile(path, userData, file?.sha, `👤 Sync User: ${userEmail}`);
      return NextResponse.json({ success: true, user: userData });
    }

    // Actions Textes
    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      
      const newPub = { ...data, id: pubId, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      const ok = await updateFile(pubPath, newPub, null, `🚀 New: ${data.title}`);
      
      if (ok) {
        const index = await getFile(indexPath) || { content: [], sha: null };
        index.content.unshift({ id: pubId, title: data.title, author: data.authorName, category: data.category, date: newPub.date });
        await updateFile(indexPath, index.content, index.sha, `📝 Index Update`);
      }
      return NextResponse.json({ success: ok, id: pubId });
    }

    // Actions Économiques
    if (action === 'transfer_li') {
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (!sender?.content || !receiver?.content || sender.content.li < amount) 
        return NextResponse.json({ error: "Solde insuffisant ou utilisateur inconnu" });

      sender.content.li -= amount;
      receiver.content.li += amount;
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent ${amount} Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received ${amount} Li`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) { 
    const status = e.message === "THROTTLED" ? 429 : 500;
    return NextResponse.json({ error: e.message }, { status }); 
  }
}

// --- MÉTHODE GET (Lectures) ---

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  let result;
  if (type === 'text') result = await getFile(`data/texts/${id}.json`);
  if (type === 'user') result = await getFile(getSafePath(id));
  if (type === 'library') result = await getFile(`data/publications/index.json`);

  if (result?.error === "THROTTLED") return NextResponse.json({ error: "GitHub Limit" }, { status: 429 });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result);
}

// --- MÉTHODE PATCH (Mises à jour rapides) ---

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const file = await getFile(`data/texts/${id}.json`);
    if (!file?.content) return NextResponse.json({ error: "Introuvable" });

    if (action === 'view') file.content.views++;
    if (action === 'like') file.content.likes++;
    if (action === 'certify') file.content.certified = (file.content.certified || 0) + 1;

    await updateFile(`data/texts/${id}.json`, file.content, file.sha, `📈 Stat: ${action}`);
    return NextResponse.json({ success: true, count: file.content[action === 'certify' ? 'certified' : action + 's'] });
  } catch (e) { return NextResponse.json({ error: e.message }); }
  }
    
