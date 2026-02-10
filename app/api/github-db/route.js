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

const ECONOMY = {
  MIN_TRANSFER: 1000,
  WITHDRAWAL_THRESHOLD: 25000, // 5 USD
  LI_VALUE_USD: 0.0002 // 1000 Li = 0.20 USD
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

// --- ROUTE PRINCIPALE POST ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userEmail, textId, amount, ...data } = body;
    const targetPath = getSafePath(userEmail || data.email);

    // 1. AUTH & COMPTE
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

    // 2. TEXTES
    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const newPub = { ...data, id: pubId, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const index = await getFile(indexPath) || { content: [] };
      index.content.unshift({ 
        id: pubId, title: data.title, author: data.authorName, 
        authorEmail: data.authorEmail, category: data.category, date: newPub.date 
      });
      await updateFile(indexPath, index.content, index.sha, `📝 Index Update`);
      
      return NextResponse.json({ success: true, id: pubId });
    }

    // 3. ÉCONOMIE (Transfert & Retrait)
    if (action === 'transfer_li' || action === 'gift_li') {
      if (amount < ECONOMY.MIN_TRANSFER) {
        return NextResponse.json({ error: `Le minimum d'envoi est de ${ECONOMY.MIN_TRANSFER} Li` }, { status: 400 });
      }

      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      
      if (!sender || !receiver) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      if (sender.content.li < amount) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });
      
      sender.content.li -= amount;
      receiver.content.li += amount;
      
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent ${amount} Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received ${amount} Li`);
      return NextResponse.json({ success: true });
    }

    if (action === 'request_withdrawal') {
      const user = await getFile(targetPath);
      if (user.content.li < ECONOMY.WITHDRAWAL_THRESHOLD) {
        return NextResponse.json({ 
          error: `Seuil de retrait non atteint (${ECONOMY.WITHDRAWAL_THRESHOLD} Li requis)` 
        }, { status: 400 });
      }
      // Logique de demande de retrait à implémenter (ex: enregistrer dans data/withdrawals.json)
      return NextResponse.json({ success: true, message: "Demande de retrait enregistrée" });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// --- MÉTHODE GET ---

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    if (type === 'text') return NextResponse.json(await getFile(`data/texts/${id}.json`));
    if (type === 'user') {
        const user = await getFile(getSafePath(id));
        if (user) {
            // Ajouter dynamiquement la valeur estimée en USD
            user.content.li_usd_value = (user.content.li * ECONOMY.LI_VALUE_USD).toFixed(2);
        }
        return NextResponse.json(user);
    }
    if (type === 'library' || type === 'publications') return NextResponse.json(await getFile(`data/publications/index.json`));
    
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// --- MÉTHODE PATCH ---

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const path = `data/texts/${id}.json`;
    const textFile = await getFile(path);
    
    if (!textFile) return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });

    if (action === 'view') textFile.content.views = (textFile.content.views || 0) + 1;
    if (action === 'like') textFile.content.likes = (textFile.content.likes || 0) + 1;
    
    if (action === 'certify') {
      textFile.content.certified = (textFile.content.certified || 0) + 1;
      const authorPath = getSafePath(textFile.content.authorEmail);
      const authorFile = await getFile(authorPath);
      if (authorFile) {
        authorFile.content.li = (authorFile.content.li || 0) + 1;
        await updateFile(authorPath, authorFile.content, authorFile.sha, `💎 Reward: +1 Li`);
      }
    }

    await updateFile(path, textFile.content, textFile.sha, `📈 Stat update: ${action}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
