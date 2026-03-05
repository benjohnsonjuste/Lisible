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
  WELCOME_BONUS: 50,
  REF_BONUS: 200
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
    const { action, userEmail, textId, duelId, amount, currentPassword, newPassword, adminToken, guestBonus, ...data } = body;
    
    const emailToUse = userEmail || data.email;
    const targetPath = getSafePath(emailToUse);

    if (action === 'register') {
      const file = await getFile(targetPath);
      if (file) return NextResponse.json({ error: "Ce compte existe déjà" }, { status: 400 });
      
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(data.password, salt);
      
      // Calcul du solde initial : Bienvenue + (Parrainage ? 200 : 0) + Bonus Lecture accumulé
      const initialLi = ECONOMY.WELCOME_BONUS + (data.referralCode ? ECONOMY.REF_BONUS : 0) + (guestBonus || 0);

      const userData = {
        email: data.email.toLowerCase().trim(),
        name: data.name || "Nouvel Auteur",
        li: initialLi,
        status: "active",
        notifications: [], followers: [], following: [], works: [],
        bookmarks: [],
        created_at: new Date().toISOString(),
        ...data,
        password: hashedPassword 
      };

      if (guestBonus > 0) {
        userData.notifications.push({
          id: `bonus_${Date.now()}`,
          type: "gift",
          message: `Félicitations ! Vos ${guestBonus} Li accumulés en tant que visiteur ont été transférés.`,
          date: new Date().toISOString(),
          read: false
        });
      }

      await updateFile(targetPath, userData, null, `👤 User Register: ${data.email} (+${initialLi} Li)`);
      const { password, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'login') {
      let file = await getFile(targetPath);
      if (!file) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
      
      if (file.content.status === "deleted") {
        return NextResponse.json({ error: "Ce compte est supprimé.", isDeleted: true }, { status: 403 });
      }

      const isMatch = bcrypt.compareSync(data.password, file.content.password) || bcrypt.compareSync(data.password.trim(), file.content.password);
      if (!isMatch) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
      
      const { password, ...safeUser } = file.content;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'publish') {
      const pubId = data.id || `txt_${Date.now()}`;
      const pubPath = `data/texts/${pubId}.json`;
      const indexPath = `data/publications/index.json`;
      // Support Unsplash (image) ou fallback Base64
      const finalImage = data.image || data.imageBase64 || null;

      const newPub = { ...data, id: pubId, image: finalImage, date: new Date().toISOString(), views: 0, likes: 0, comments: [], certified: 0 };
      await updateFile(pubPath, newPub, null, `🚀 Publish: ${data.title}`);
      
      const indexFile = await getFile(indexPath) || { content: [] };
      let indexContent = Array.isArray(indexFile.content) ? indexFile.content : [];
      indexContent.unshift({ 
        id: pubId, 
        title: data.title, 
        author: data.authorName, 
        authorEmail: data.authorEmail, 
        category: data.category, 
        genre: data.genre, 
        image: finalImage, 
        date: newPub.date, 
        views: 0, likes: 0, certified: 0 
      });
      indexContent = globalSort(indexContent);
      await updateFile(indexPath, indexContent, indexFile.sha, `📝 Index Update`);
      return NextResponse.json({ success: true, id: pubId });
    }

    if (action === 'update_user') {
        const file = await getFile(targetPath);
        if (!file) return NextResponse.json({ error: "User not found" }, { status: 404 });
        
        // On ne met à jour que les champs autorisés (bio, penName, profilePic, etc.)
        const updatedUser = { ...file.content, ...data };
        await updateFile(targetPath, updatedUser, file.sha, `Update Profile: ${emailToUse}`);
        const { password, ...safeUser } = updatedUser;
        return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'transfer_li' || action === 'gift_li') {
      if (amount < ECONOMY.MIN_TRANSFER) return NextResponse.json({ error: "Minimum 1000 Li" }, { status: 400 });
      const sender = await getFile(getSafePath(userEmail));
      const receiver = await getFile(getSafePath(data.recipientEmail));
      
      if (!sender || !receiver) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      if (sender.content.li < amount) return NextResponse.json({ error: "Li insuffisants" }, { status: 400 });
      
      sender.content.li -= amount;
      receiver.content.li += amount;
      receiver.content.notifications.unshift({ 
        id: `gift_${Date.now()}`, 
        type: "gift", 
        message: `Vous avez reçu ${amount} Li de la part de ${sender.content.penName || sender.content.name}.`, 
        date: new Date().toISOString(), 
        read: false 
      });
      
      await updateFile(getSafePath(userEmail), sender.content, sender.sha, `💸 Sent Li`);
      await updateFile(getSafePath(data.recipientEmail), receiver.content, receiver.sha, `💰 Received Li`);
      return NextResponse.json({ success: true });
    }

    // ... Reste des actions (follow, delete, etc.) identiques ...
    return NextResponse.json({ error: "Action non gérée" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  try {
    if (type === 'user') {
        const user = await getFile(getSafePath(id));
        if (user) {
            user.content.li_usd_value = (user.content.li * ECONOMY.LI_VALUE_USD).toFixed(2);
            user.content.is_eligible_withdrawal = (user.content.li >= ECONOMY.WITHDRAWAL_THRESHOLD && (user.content.followers?.length || 0) >= ECONOMY.REQUIRED_FOLLOWERS);
            delete user.content.password;
        }
        return NextResponse.json(user);
    }
    if (type === 'publications') {
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
    const { id, action, amount } = body;

    const path = `data/texts/${id}.json`;
    const textFile = await getFile(path);
    if (!textFile) return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });

    if (action === 'add_li') {
        // Nouvelle action pour récompenser les lecteurs (anonymes ou non)
        const userPath = getSafePath(id); // id est l'email ici
        const userFile = await getFile(userPath);
        if (userFile) {
            userFile.content.li = (userFile.content.li || 0) + (amount || 5);
            await updateFile(userPath, userFile.content, userFile.sha, `🎁 Reward Li: +${amount}`);
            return NextResponse.json({ success: true, newBalance: userFile.content.li });
        }
    }

    if (action === 'view') textFile.content.views = (textFile.content.views || 0) + 1;
    if (action === 'like') textFile.content.likes = (textFile.content.likes || 0) + 1;

    await updateFile(path, textFile.content, textFile.sha, `📈 Text Stats: ${action}`);
    
    // Sync Index
    const indexPath = `data/publications/index.json`;
    const indexFile = await getFile(indexPath);
    if (indexFile) {
        const idx = indexFile.content.findIndex(t => t.id === id);
        if (idx > -1) {
            indexFile.content[idx].views = textFile.content.views;
            indexFile.content[idx].likes = textFile.content.likes;
            await updateFile(indexPath, indexFile.content, indexFile.sha, `🔄 Index Sync`);
        }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
