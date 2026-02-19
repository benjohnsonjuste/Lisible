import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';

// Cache désactivé pour permettre la mise à jour des données sans déploiement
const localCache = new Map();
const CACHE_TTL = 0; 

export const dynamic = 'force-dynamic';
// Utilisation du runtime nodejs pour une meilleure compatibilité avec l'API GitHub et bcrypt sur Vercel
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
    if (res.status === 429) throw new Error("THROTTLED");
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
        // Ajout de [skip ci] pour empêcher les déploiements Vercel automatiques à chaque changement de data
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
  return `data/users/${email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}.json`;
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
    const { action, userEmail, textId, amount, currentPassword, newPassword, ...data } = body;
    const targetPath = getSafePath(userEmail || data.email);

    if (action === 'register') {
      const file = await getFile(targetPath);
      if (file) return NextResponse.json({ error: "Ce compte existe déjà" }, { status: 400 });
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(data.password.trim(), salt);
      const userData = {
        email: data.email.toLowerCase().trim(),
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
      const storedPassword = file.content.password;
      const providedPassword = data.password.trim();
      let isMatch = false;
      const isHashed = typeof storedPassword === 'string' && (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$'));
      if (isHashed) {
        isMatch = bcrypt.compareSync(providedPassword, storedPassword);
      } else {
        isMatch = (providedPassword === storedPassword);
        if (isMatch) {
          const salt = bcrypt.genSaltSync(10);
          file.content.password = bcrypt.hashSync(providedPassword, salt);
          await updateFile(targetPath, file.content, file.sha, `🔐 Auto-fix: Hash plain password`);
        }
      }
      if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'change_password') {
      const file = await getFile(targetPath);
      if (!file) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
      const isMatch = bcrypt.compareSync(currentPassword.trim(), file.content.password);
      if (!isMatch) return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 401 });
      const salt = bcrypt.genSaltSync(10);
      file.content.password = bcrypt.hashSync(newPassword.trim(), salt);
      await updateFile(targetPath, file.content, file.sha, `🔐 Password Change: ${userEmail}`);
      return NextResponse.json({ success: true });
    }

    if (action === 'user_sync' || action === 'update_user') {
      const file = await getFile(targetPath);
      if (!file) return NextResponse.json({ error: "Sync impossible" }, { status: 404 });
      const userData = { ...file.content, ...data };
      await updateFile(targetPath, userData, file.sha, `👤 User Sync/Update`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'follow' || action === 'unfollow') {
      const follower = await getFile(getSafePath(userEmail));
      const target = await getFile(getSafePath(data.targetEmail));
      if (!follower || !target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      
      const targetEmailClean = data.targetEmail.toLowerCase().trim();
      const userEmailClean = userEmail.toLowerCase().trim();

      if (action === 'follow') {
        if (!follower.content.following.includes(targetEmailClean)) {
          follower.content.following.push(targetEmailClean);
          target.content.followers.push(userEmailClean);
          target.content.notifications.unshift({
            id: `follow_${Date.now()}`, type: "follow",
            message: `${follower.content.name} s'est abonné à vous !`,
            date: new Date().toISOString(), read: false
          });
        }
      } else {
        follower.content.following = follower.content.following.filter(e => e !== targetEmailClean);
        target.content.followers = target.content.followers.filter(e => e !== userEmailClean);
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
      const newPub = { ...data, id: pubId, isConcours, image: finalImage, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const indexFile = await getFile(indexPath) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ 
        id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, 
        category: data.category, genre: data.genre, isConcours, image: finalImage, date: newPub.date, views: 0, likes: 0, certified: 0 
      });
      indexContent = globalSort(indexContent);
      await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update & Sort`);
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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is missing");
    if (type === 'text') {
        const text = await getFile(`data/texts/${id}.json`);
        return NextResponse.json(text);
    }
    if (type === 'user') {
        const user = await getFile(getSafePath(id));
        if (user) {
            user.content.li_usd_value = (user.content.li * ECONOMY.LI_VALUE_USD).toFixed(2);
            user.content.is_eligible_withdrawal = (user.content.li >= ECONOMY.WITHDRAWAL_THRESHOLD && (user.content.followers?.length || 0) >= ECONOMY.REQUIRED_FOLLOWERS);
            delete user.content.password;
        }
        return NextResponse.json(user);
    }
    if (type === 'library' || type === 'publications') {
      const index = await getFile(`data/publications/index.json`);
      if (index && Array.isArray(index.content)) index.content = globalSort(index.content);
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
    const { id, action } = body;
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

    if (indexFile && Array.isArray(indexFile.content)) {
      const itemIndex = indexFile.content.findIndex(t => t.id === id);
      if (itemIndex > -1) {
        indexFile.content[itemIndex].views = textFile.content.views;
        indexFile.content[itemIndex].likes = textFile.content.likes;
        indexFile.content[itemIndex].certified = textFile.content.certified;
        indexFile.content = globalSort(indexFile.content);
        await updateFile(indexPath, indexFile.content, indexFile.sha, `🔄 Sync Index: ${id} (${action})`);
      }
    }
    if (authorFile) {
      if (action === 'like') {
        authorFile.content.notifications.unshift({ id: `like_${Date.now()}`, type: "like", message: `Quelqu'un a aimé votre texte "${textFile.content.title}" !`, date: new Date().toISOString(), read: false });
      }
      if (action === 'certify') {
        authorFile.content.li = (authorFile.content.li || 0) + 1;
        authorFile.content.notifications.unshift({ id: `cert_${Date.now()}`, type: "certification", message: `Sceau de Certification reçu pour "${textFile.content.title}" (+1 Li).`, date: new Date().toISOString(), read: false });
      }
      await updateFile(authorPath, authorFile.content, authorFile.sha, `🔔 Author Sync: ${action}`);
    }
    await updateFile(path, textFile.content, textFile.sha, `📈 Text Update: ${action}`);
    return NextResponse.json({ success: true, count: action === 'view' ? textFile.content.views : (action === 'like' ? textFile.content.likes : textFile.content.certified) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}