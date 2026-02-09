import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// --- HELPERS GITHUB ---

async function getFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { content: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')), sha: data.sha };
  } catch { return null; }
}

async function updateFile(path, content, sha, message) {
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

const getSafePath = (email) => `data/users/${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

// --- MÉTHODE POST : CRÉATION & ACTIONS COMPLEXES ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userEmail, textId, amount, ...data } = body;

    // 1. AUTH & COMPTE (Login, Register, Update User, Reset Password)
    if (action === 'user_sync') {
      const path = getSafePath(userEmail);
      const file = await getFile(path);
      const userData = file ? { ...file.content, ...data } : { 
        email: userEmail, ...data, li: 50, followers: [], following: [], created_at: new Date().toISOString() 
      };
      await updateFile(path, userData, file?.sha, `👤 Sync User: ${userEmail}`);
      return NextResponse.json({ success: true, user: userData });
    }

    // 2. TEXTES (Publish, Comment, Report, Delete Work)
    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      
      const newPub = { ...data, id: pubId, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 New: ${data.title}`);
      
      const index = await getFile(indexPath) || { content: [], sha: null };
      index.content.unshift({ id: pubId, title: data.title, author: data.authorName, category: data.category, date: newPub.date });
      await updateFile(indexPath, index.content, index.sha, `📝 Index Update`);
      
      return NextResponse.json({ success: true, id: pubId });
    }

    if (action === 'comment') {
      const file = await getFile(`data/texts/${textId}.json`);
      if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
      file.content.comments.unshift({ user: userEmail, text: data.comment, date: new Date().toISOString() });
      await updateFile(`data/texts/${textId}.json`, file.content, file.sha, `💬 Comment on ${textId}`);
      return NextResponse.json({ success: true });
    }

    // 3. ÉCONOMIE (Wallet, Gift Li, Process Purchase, Withdraw)
    if (action === 'transfer_li') {
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (!sender || !receiver || sender.content.li < amount) return NextResponse.json({ error: "Invalide" });

      sender.content.li -= amount;
      receiver.content.li += amount;
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent ${amount} Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received ${amount} Li`);
      return NextResponse.json({ success: true });
    }

    // 4. SOCIAL (Follow, Subscribe, Notifications)
    if (action === 'toggle_follow') {
      const me = await getFile(getSafePath(userEmail));
      const target = await getFile(getSafePath(data.targetEmail));
      const isFollowing = me.content.following.includes(data.targetEmail);
      
      me.content.following = isFollowing ? me.content.following.filter(e => e !== data.targetEmail) : [...me.content.following, data.targetEmail];
      target.content.followers = isFollowing ? target.content.followers.filter(e => e !== userEmail) : [...target.content.followers, userEmail];
      
      await updateFile(getSafePath(userEmail), me.content, me.sha, `🤝 Toggle Follow`);
      await updateFile(getSafePath(data.targetEmail), target.content, target.sha, `👥 Follower update`);
      return NextResponse.json({ success: true, following: !isFollowing });
    }

    // 5. ADMIN (Full Cleanup, Global Stats)
    if (action === 'admin_cleanup') {
       // Logique de suppression massive (à manipuler avec précaution)
       return NextResponse.json({ success: true, message: "Système nettoyé" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

// --- MÉTHODE GET : LECTURE & RECHERCHE ---

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (type === 'text') return NextResponse.json(await getFile(`data/texts/${id}.json`));
  if (type === 'user') return NextResponse.json(await getFile(getSafePath(id)));
  if (type === 'library') return NextResponse.json(await getFile(`data/publications/index.json`));
  if (type === 'search') {
    const index = await getFile(`data/publications/index.json`);
    const query = searchParams.get('q').toLowerCase();
    const results = index.content.filter(t => t.title.toLowerCase().includes(query) || t.author.toLowerCase().includes(query));
    return NextResponse.json(results);
  }

  return NextResponse.json({ error: "Type manquant" }, { status: 400 });
}

// --- MÉTHODE PATCH : STATS RAPIDES (Vues, Likes, Certify) ---

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const file = await getFile(`data/texts/${id}.json`);
    if (!file) return NextResponse.json({ error: "Introuvable" });

    if (action === 'view') file.content.views++;
    if (action === 'like') file.content.likes++;
    if (action === 'certify') file.content.certified++;

    await updateFile(`data/texts/${id}.json`, file.content, file.sha, `📈 Stat: ${action}`);
    return NextResponse.json({ success: true, count: file.content[action === 'certify' ? 'certified' : action + 's'] });
  } catch (e) { return NextResponse.json({ error: e.message }); }
}
