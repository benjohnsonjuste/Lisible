import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt-ts';
import { createHash } from 'crypto';

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

// --- ROUTE PRINCIPALE ---

export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const body = await req.json();
    const { 
      action, id, textId, userEmail, userName, userPic, comment, 
      authorEmail, textTitle, isPodcast, duelId, amount, 
      currentPassword, newPassword, adminToken, ...data 
    } = body;
    
    const contentId = id || textId;
    const emailToUse = userEmail || data.email;
    const targetPath = getSafePath(emailToUse);

    // 1. GESTION DES UTILISATEURS (Inchangé)
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
        return NextResponse.json({ error: "Ce compte est en attente de suppression.", isDeleted: true, email: file.content.email }, { status: 403 });
      }
      const storedPassword = file.content.password;
      const providedPassword = data.password;
      let isMatch = false;
      const isHashed = typeof storedPassword === 'string' && storedPassword.startsWith('$2');
      if (isHashed) {
        isMatch = bcrypt.compareSync(providedPassword, storedPassword);
        if (!isMatch) isMatch = bcrypt.compareSync(providedPassword.trim(), storedPassword);
      } else {
        isMatch = (providedPassword === storedPassword || providedPassword.trim() === storedPassword);
        if (isMatch) {
          const salt = bcrypt.genSaltSync(10);
          file.content.password = bcrypt.hashSync(providedPassword.trim(), salt);
          await updateFile(targetPath, file.content, file.sha, `🔐 Security Fix: Hashing plain password`);
        }
      }
      if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // 2. GESTION DES INTERACTIONS UNIQUES & COMMENTAIRES (Podcast & Texte)
    if (['comment', 'toggle_like', 'like', 'certify_content', 'certify', 'view'].includes(action)) {
      const isPod = isPodcast || (contentId && contentId.startsWith('pod_'));
      const contentPath = isPod ? `data/podcasts.json` : `data/texts/${contentId}.json`;
      
      const fileMeta = await getFile(contentPath);
      if (!fileMeta) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 });

      let targetObject = null;
      if (isPod) {
        if (!Array.isArray(fileMeta.content)) fileMeta.content = [];
        targetObject = fileMeta.content.find(p => p.id === contentId);
      } else {
        targetObject = fileMeta.content;
      }

      if (!targetObject) return NextResponse.json({ error: "Objet non trouvé" }, { status: 404 });

      // Action: Commentaire
      if (action === 'comment') {
        if (!targetObject.comments) targetObject.comments = [];
        targetObject.comments.push({
          userName: userName || "Plume",
          userEmail: userEmail,
          userPic: userPic,
          text: comment,
          date: new Date().toISOString()
        });
      } 
      // Actions: Interactions (Like/Certify/View)
      else {
        const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
        const ua = req.headers.get('user-agent') || 'unknown';
        const fingerprint = createHash('md5').update(`${ip}-${ua}-${contentId}-${action}`).digest('hex');
        
        if (!targetObject.interactions) targetObject.interactions = [];
        if (action !== 'view' && targetObject.interactions.includes(fingerprint)) {
          return NextResponse.json({ success: true, alreadyDone: true });
        }

        if (action === 'like' || action === 'toggle_like') targetObject.likes = (targetObject.likes || 0) + 1;
        if (action === 'certify' || action === 'certify_content') targetObject.certified = (targetObject.certified || 0) + 1;
        if (action === 'view') targetObject.views = (targetObject.views || 0) + 1;
        
        if (action !== 'view') targetObject.interactions.push(fingerprint);
      }

      await updateFile(contentPath, fileMeta.content, fileMeta.sha, `${action} on ${contentId}`);

      // Notifications & Récompenses Li
      if (authorEmail && authorEmail.toLowerCase() !== userEmail?.toLowerCase()) {
        const authorPath = getSafePath(authorEmail);
        const authorFile = await getFile(authorPath);
        if (authorFile) {
          if (!authorFile.content.notifications) authorFile.content.notifications = [];
          let msg = "";
          if (action === 'comment') msg = `${userName} a commenté "${textTitle || targetObject.title}"`;
          if (action.includes('like')) msg = `Coup de cœur sur "${textTitle || targetObject.title}" !`;
          if (action.includes('certify')) {
            msg = `Sceau apposé sur "${textTitle || targetObject.title}" (+1 Li).`;
            authorFile.content.li = (authorFile.content.li || 0) + 1;
          }
          if (msg) {
            authorFile.content.notifications.unshift({ id: `nt_${Date.now()}`, type: action, message: msg, date: new Date().toISOString(), read: false });
            await updateFile(authorPath, authorFile.content, authorFile.sha, `Reward/Notif for ${action}`);
          }
        }
      }

      // Sync Index (pour les textes)
      if (!isPod) {
        const indexFile = await getFile(`data/publications/index.json`);
        if (indexFile && Array.isArray(indexFile.content)) {
          const idx = indexFile.content.findIndex(t => t.id === contentId);
          if (idx > -1) {
            indexFile.content[idx].likes = targetObject.likes;
            indexFile.content[idx].certified = targetObject.certified;
            indexFile.content[idx].views = targetObject.views;
            await updateFile(`data/publications/index.json`, indexFile.content, indexFile.sha, `Sync Index`);
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // 3. PUBLISH, FOLLOW, TRANSFERT (Tes fonctions originales)
    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const finalImage = data.image || data.imageBase64 || null;
      const newPub = { ...data, id: pubId, image: finalImage, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      const indexFile = await getFile(indexPath) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, category: data.category, genre: data.genre, isConcours: data.isConcours || false, image: finalImage, date: newPub.date, views: 0, likes: 0, certified: 0 });
      indexContent = globalSort(indexContent);
      await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update & Sort`);
      return NextResponse.json({ success: true, id: pubId });
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
          target.content.notifications.unshift({ id: `follow_${Date.now()}`, type: "follow", message: `${follower.content.name} s'est abonné à vous !`, date: new Date().toISOString(), read: false });
        }
      } else {
        follower.content.following = follower.content.following.filter(e => e !== targetEmailClean);
        target.content.followers = target.content.followers.filter(e => e !== userEmailClean);
      }
      await updateFile(getSafePath(userEmail), follower.content, follower.sha, `👥 ${action}: following`);
      await updateFile(getSafePath(data.targetEmail), target.content, target.sha, `👥 ${action}: followers`);
      return NextResponse.json({ success: true });
    }

    if (action === 'transfer_li' || action === 'gift_li') {
      if (amount < ECONOMY.MIN_TRANSFER) return NextResponse.json({ error: "Minimum non atteint" }, { status: 400 });
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      if (!sender || !receiver) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      if (sender.content.li < amount) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });
      sender.content.li -= amount;
      receiver.content.li += amount;
      receiver.content.notifications.unshift({ id: `nt_${Date.now()}`, type: "gift", message: `Vous avez reçu ${amount} Li de la part de ${sender.content.name}.`, date: new Date().toISOString(), read: false });
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received Li`);
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_bookmark') {
      const userFile = await getFile(targetPath);
      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      const user = userFile.content;
      if (!user.bookmarks) user.bookmarks = [];
      const exists = user.bookmarks.find(b => b.id === textId);
      if (exists) { user.bookmarks = user.bookmarks.filter(b => b.id !== textId); } 
      else { user.bookmarks.push({ id: textId, title: data.title, author: data.authorName, date: new Date().toISOString() }); }
      await updateFile(targetPath, user, userFile.sha, `🔖 Bookmark toggle: ${textId}`);
      return NextResponse.json({ success: true, bookmarks: user.bookmarks });
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
    if (type === 'library' || type === 'publications') {
      const index = await getFile(`data/publications/index.json`);
      if (index && Array.isArray(index.content)) index.content = globalSort(index.content);
      return NextResponse.json(index);
    }
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: "Erreur serveur" }, { status: 500 }); }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, action, notifId } = body;
    if (action === 'mark_read') {
      const userPath = getSafePath(id);
      const userFile = await getFile(userPath);
      if (!userFile) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      userFile.content.notifications = (userFile.content.notifications || []).map(n => n.id === notifId ? { ...n, read: true } : n);
      await updateFile(userPath, userFile.content, userFile.sha, `🔕 Notif read: ${notifId}`);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Action PATCH inconnue" }, { status: 400 });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
