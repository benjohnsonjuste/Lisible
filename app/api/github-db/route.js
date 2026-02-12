import { NextResponse } from 'next/server';
import NodeCache from 'node-cache';
import bcrypt from 'bcryptjs';

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
  WITHDRAWAL_THRESHOLD: 25000, 
  REQUIRED_FOLLOWERS: 250,      
  LI_VALUE_USD: 0.0002 
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

    if (action === 'register') {
      const file = await getFile(targetPath);
      if (file) return NextResponse.json({ error: "Ce compte existe déjà" }, { status: 400 });
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const userData = {
        email: data.email,
        name: data.name || "Nouvel Auteur",
        li: data.referralCode ? 250 : 50,
        notifications: [], followers: [], following: [], works: [],
        created_at: new Date().toISOString(),
        ...data,
        password: hashedPassword 
      };
      await updateFile(targetPath, userData, null, `👤 User Register: ${data.email}`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'login') {
      const file = await getFile(targetPath);
      if (!file) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
      const isMatch = await bcrypt.compare(data.password, file.content.password);
      if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'user_sync' || action === 'update_user') {
      const file = await getFile(targetPath);
      const userData = file ? { ...file.content, ...data } : null;
      if (!userData) return NextResponse.json({ error: "Sync impossible" }, { status: 404 });
      await updateFile(targetPath, userData, file?.sha, `👤 User Sync/Update`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // GESTION FOLLOW / UNFOLLOW (Synchronisation Bi-latérale)
    if (action === 'follow' || action === 'unfollow') {
      const follower = await getFile(getSafePath(userEmail));
      const target = await getFile(getSafePath(data.targetEmail));
      
      if (!follower || !target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      if (action === 'follow') {
        if (!follower.content.following.includes(data.targetEmail)) {
          follower.content.following.push(data.targetEmail);
          target.content.followers.push(userEmail);
          target.content.notifications.unshift({
            id: `follow_${Date.now()}`,
            type: "follow",
            message: `${follower.content.name} s'est abonné à vous !`,
            date: new Date().toISOString(), read: false
          });
        }
      } else {
        follower.content.following = follower.content.following.filter(e => e !== data.targetEmail);
        target.content.followers = target.content.followers.filter(e => e !== userEmail);
      }

      await updateFile(getSafePath(userEmail), follower.content, follower.sha, `👥 ${action}: following`);
      await updateFile(getSafePath(data.targetEmail), target.content, target.sha, `👥 ${action}: followers`);
      
      return NextResponse.json({ success: true, followersCount: target.content.followers.length });
    }

    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const isConcours = data.isConcours === true || data.genre === "Battle Poétique";
      const finalImage = isConcours ? null : (data.image || data.imageBase64);
      const newPub = { ...data, id: pubId, image: finalImage, imageBase64: finalImage, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const indexFile = await getFile(indexPath) || { content: [] };
      const indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, category: data.category, genre: data.genre, isConcours: isConcours, image: finalImage, date: newPub.date, views: 0, likes: 0, certified: 0 });
      await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update`);
      return NextResponse.json({ success: true, id: pubId });
    }

    if (action === 'transfer_li' || action === 'gift_li') {
      if (amount < ECONOMY.MIN_TRANSFER) return NextResponse.json({ error: "Minimum non atteint" }, { status: 400 });
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (!sender || !receiver) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      if (sender.content.li < amount) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });
      sender.content.li -= amount;
      receiver.content.li += amount;
      receiver.content.notifications.unshift({ id: `notif_${Date.now()}`, type: "gift", message: `Vous avez reçu ${amount} Li de la part de ${sender.content.name}.`, date: new Date().toISOString(), read: false });
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received Li`);
      return NextResponse.json({ success: true });
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
            user.content.li_usd_value = (user.content.li * ECONOMY.LI_VALUE_USD).toFixed(2);
            user.content.is_eligible_withdrawal = (user.content.li >= ECONOMY.WITHDRAWAL_THRESHOLD && (user.content.followers?.length || 0) >= ECONOMY.REQUIRED_FOLLOWERS);
            delete user.content.password;
        }
        return NextResponse.json(user);
    }
    if (type === 'library' || type === 'publications') return NextResponse.json(await getFile(`data/publications/index.json`));
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// --- MÉTHODE PATCH (SYNCHRO STATS TEXTES) ---

export async function PATCH(req) {
  try {
    const { id, action } = await req.json();
    const path = `data/texts/${id}.json`;
    const indexPath = `data/publications/index.json`;
    
    const textFile = await getFile(path);
    if (!textFile) return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });

    const authorPath = getSafePath(textFile.content.authorEmail);
    const authorFile = await getFile(authorPath);
    const indexFile = await getFile(indexPath);

    if (action === 'view') textFile.content.views = (textFile.content.views || 0) + 1;
    if (action === 'like') textFile.content.likes = (textFile.content.likes || 0) + 1;
    if (action === 'certify') textFile.content.certified = (textFile.content.certified || 0) + 1;

    if (indexFile) {
      const itemIndex = indexFile.content.findIndex(t => t.id === id);
      if (itemIndex > -1) {
        indexFile.content[itemIndex].views = textFile.content.views;
        indexFile.content[itemIndex].likes = textFile.content.likes;
        indexFile.content[itemIndex].certified = textFile.content.certified;
        await updateFile(indexPath, indexFile.content, indexFile.sha, `🔄 Sync Index: ${id}`);
      }
    }

    if (authorFile) {
      if (action === 'like') {
        authorFile.content.notifications.unshift({
          id: `like_${Date.now()}`,
          type: "like",
          message: `Quelqu'un a aimé votre texte "${textFile.content.title}" !`,
          date: new Date().toISOString(), read: false
        });
      }
      if (action === 'certify') {
        authorFile.content.li = (authorFile.content.li || 0) + 1;
        authorFile.content.notifications.unshift({
          id: `cert_${Date.now()}`,
          type: "certification",
          message: `Sceau de Certification reçu pour "${textFile.content.title}" (+1 Li).`,
          date: new Date().toISOString(), read: false
        });
      }
      await updateFile(authorPath, authorFile.content, authorFile.sha, `🔔 Author Sync: ${action}`);
    }

    await updateFile(path, textFile.content, textFile.sha, `📈 Text Update: ${action}`);
    return NextResponse.json({ success: true, count: action === 'view' ? textFile.content.views : (action === 'like' ? textFile.content.likes : textFile.content.certified) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
