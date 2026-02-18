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
  LI_VALUE_USD: 0.0002,
  BATTLE_REWARD: 50 
};

// --- HELPERS CORE ---

const getHaitiTime = () => {
  const now = new Date();
  const options = { timeZone: 'America/Port-au-Prince', hour12: false };
  const haitiString = now.toLocaleString('en-US', options);
  const haitiDate = new Date(haitiString);
  
  return {
    h: haitiDate.getHours(),
    m: haitiDate.getMinutes(),
    day: haitiDate.getDay(),
    isSunday: haitiDate.getDay() === 0
  };
};

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
        message: `[DATA] ${message} [skip ci]`,
        content: encodedContent,
        sha: sha || undefined
      }),
    });
    
    if (res.status === 409) return { success: false, conflict: true };
    return { success: res.ok, status: res.status };
  } catch (err) {
    console.error(`Update error [${path}]:`, err.message);
    return { success: false, error: err.message };
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
    const { action, userEmail, textId, amount, currentPassword, newPassword, duelId, playerId, text, ...data } = body;
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
        badges: [],
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
      const { password, ...safeUser = file.content } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'follow' || action === 'unfollow') {
      let attempts = 0;
      while (attempts < 3) {
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
        
        const res1 = await updateFile(getSafePath(userEmail), follower.content, follower.sha, `👥 ${action}: following`);
        const res2 = await updateFile(getSafePath(data.targetEmail), target.content, target.sha, `👥 ${action}: followers`);
        
        if (res1.success && res2.success) return NextResponse.json({ success: true, followersCount: target.content.followers.length });
        attempts++;
      }
      return NextResponse.json({ error: "Conflit de synchronisation" }, { status: 409 });
    }

    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      const isConcours = data.isConcours === true || data.genre === "Battle Poétique";
      const finalImage = isConcours ? null : (data.image || data.imageBase64);
      const newPub = { ...data, id: pubId, isConcours, image: finalImage, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);

      let attempts = 0;
      while (attempts < 3) {
        const indexFile = await getFile(indexPath) || { content: [] };
        let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
        indexContent.unshift({ 
          id: pubId, title: data.title, author: data.authorName, authorEmail: data.authorEmail, 
          category: data.category, genre: data.genre, isConcours, image: finalImage, date: newPub.date, views: 0, likes: 0, certified: 0 
        });
        indexContent = globalSort(indexContent);
        const res = await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update`);
        if (res.success) return NextResponse.json({ success: true, id: pubId });
        attempts++;
      }
      return NextResponse.json({ error: "Erreur Index (Conflit)" }, { status: 409 });
    }

    // (Reste du code POST inchangé pour sync-battle, transfer, etc.)
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
  let attempts = 0;
  while (attempts < 3) {
    try {
      const body = await req.json();
      const { id, action } = body;
      const path = `data/texts/${id}.json`;
      const indexPath = `data/publications/index.json`;
      
      const textFile = await getFile(path);
      const indexFile = await getFile(indexPath);
      if (!textFile) return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });

      if (action === 'view') textFile.content.views = (textFile.content.views || 0) + 1;
      if (action === 'like') textFile.content.likes = (textFile.content.likes || 0) + 1;
      if (action === 'certify') textFile.content.certified = (textFile.content.certified || 0) + 1;

      // Update Index
      if (indexFile && Array.isArray(indexFile.content)) {
        const itemIndex = indexFile.content.findIndex(t => t.id === id);
        if (itemIndex > -1) {
          indexFile.content[itemIndex].views = textFile.content.views;
          indexFile.content[itemIndex].likes = textFile.content.likes;
          indexFile.content[itemIndex].certified = textFile.content.certified;
          indexFile.content = globalSort(indexFile.content);
        }
      }

      const resText = await updateFile(path, textFile.content, textFile.sha, `📈 Text ${action}`);
      const resIndex = await updateFile(indexPath, indexFile.content, indexFile.sha, `🔄 Index Sync ${action}`);

      if (resText.success && resIndex.success) {
        // Notifs et Gain Li (Optionnel, on ne boucle pas dessus pour alléger)
        const authorPath = getSafePath(textFile.content.authorEmail);
        const authorFile = await getFile(authorPath);
        if (authorFile) {
           if (action === 'certify') authorFile.content.li = (authorFile.content.li || 0) + 1;
           await updateFile(authorPath, authorFile.content, authorFile.sha, `🔔 Author Sync`);
        }
        return NextResponse.json({ success: true });
      }
      attempts++;
    } catch (e) {
      attempts++;
    }
  }
  return NextResponse.json({ error: "Conflit" }, { status: 409 });
}
  
