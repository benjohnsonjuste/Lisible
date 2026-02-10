import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';

const localCache = new NodeCache({ stdTTL: 60 });
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS CORE ---

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
    const result = { content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')), sha: data.sha };
    localCache.set(path, result);
    return result;
  } catch (err) {
    return err.message === "THROTTLED" ? { error: "THROTTLED" } : null;
  }
}

async function updateFile(path, content, sha, message) {
  localCache.del(path);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha: sha || undefined
    }),
  });
  return res.ok;
}

const getSafePath = (email) => `data/users/${email?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}.json`;

// --- ROUTE PRINCIPALE POST (ÉCRITURE & ACTIONS) ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userEmail, textId, amount, ...data } = body;
    const targetPath = getSafePath(userEmail || data.email);

    // 1. AUTH & COMPTE (Login, Register, Update, Sync)
    if (['user_sync', 'login', 'register', 'update_user'].includes(action)) {
      const file = await getFile(targetPath);
      const isNew = !file;
      const userData = isNew ? {
        email: userEmail || data.email,
        name: data.name || "Nouvel Auteur",
        li: data.referralCode ? 250 : 50,
        notifications: [], followers: [], following: [], works: [],
        created_at: new Date().toISOString(),
        ...data
      } : { ...file.content, ...data };

      await updateFile(targetPath, userData, file?.sha, `👤 User Action: ${action}`);
      return NextResponse.json({ success: true, user: userData });
    }

    // 2. TEXTES (Publish, Comment, Report)
    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const newPub = { ...data, id: pubId, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const index = await getFile(indexPath) || { content: [] };
      index.content.unshift({ id: pubId, title: data.title, author: data.authorName, category: data.category, date: newPub.date });
      await updateFile(indexPath, index.content, index.sha, `📝 Index Update`);
      
      return NextResponse.json({ success: true, id: pubId });
    }

    if (action === 'comment') {
      const file = await getFile(`data/texts/${textId}.json`);
      file.content.comments.unshift({ user: userEmail, text: data.comment, date: new Date().toISOString() });
      await updateFile(`data/texts/${textId}.json`, file.content, file.sha, `💬 Comment on ${textId}`);
      return NextResponse.json({ success: true });
    }

    // 3. ÉCONOMIE (Transfert, Wallet, Cadeau, Retrait)
    if (action === 'transfer_li' || action === 'gift_li') {
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (sender.content.li < amount) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });
      
      sender.content.li -= amount;
      receiver.content.li += amount;
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent ${amount}`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received ${amount}`);
      return NextResponse.json({ success: true });
    }

    // 4. SOCIAL (Follow, Notif)
    if (action === 'toggle_follow') {
      const me = await getFile(getSafePath(userEmail));
      const target = await getFile(getSafePath(data.targetEmail));
      const isFollowing = me.content.following.includes(data.targetEmail);
      me.content.following = isFollowing ? me.content.following.filter(e => e !== data.targetEmail) : [...me.content.following, data.targetEmail];
      target.content.followers = isFollowing ? target.content.followers.filter(e => e !== userEmail) : [...target.content.followers, userEmail];
      await updateFile(getSafePath(userEmail), me.content, me.sha, `🤝 Follow Toggle`);
      await updateFile(getSafePath(data.targetEmail), target.content, target.sha, `👥 Followers Update`);
      return NextResponse.json({ success: true, isFollowing: !isFollowing });
    }

    if (action === 'create_notif') {
      const file = await getFile(getSafePath(data.targetEmail));
      file.content.notifications.unshift({ id: Date.now(), ...data, read: false, date: new Date().toISOString() });
      await updateFile(getSafePath(data.targetEmail), file.content, file.sha, `🔔 Notif`);
      return NextResponse.json({ success: true });
    }

    // 5. SÉCURITÉ (Delete Account, Report)
    if (action === 'delete_account') {
      // Pour GitHub, on vide le fichier ou on le marque comme supprimé
      const file = await getFile(targetPath);
      await updateFile(targetPath, { deleted: true, email: userEmail }, file.sha, `❌ Deleted Account`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- MÉTHODE GET (LECTURE & SEARCH) ---

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    if (type === 'text') return NextResponse.json(await getFile(`data/texts/${id}.json`));
    if (type === 'user') return NextResponse.json(await getFile(getSafePath(id)));
    if (type === 'library' || type === 'publications') return NextResponse.json(await getFile(`data/publications/index.json`));
    
    if (type === 'search') {
      const index = await getFile(`data/publications/index.json`);
      const q = searchParams.get('q').toLowerCase();
      const results = index.content.filter(t => t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q));
      return NextResponse.json(results);
    }
    
    if (type === 'author_works') {
      const index = await getFile(`data/publications/index.json`);
      return NextResponse.json(index.content.filter(t => t.authorEmail === id));
    }

    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "GitHub saturé" }, { status: 429 });
  }
}

// --- MÉTHODE PATCH (STATS & MISES À JOUR RAPIDES) ---

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const path = `data/texts/${id}.json`;
    const file = await getFile(path);
    
    if (action === 'view') file.content.views = (file.content.views || 0) + 1;
    if (action === 'like') file.content.likes = (file.content.likes || 0) + 1;
    if (action === 'certify') file.content.certified = (file.content.certified || 0) + 1;

    await updateFile(path, file.content, file.sha, `📈 Stat update: ${action}`);
    return NextResponse.json({ success: true, count: file.content[action === 'certify' ? 'certified' : action + 's'] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
