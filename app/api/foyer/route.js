import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Le Foyer rituel d'écriture ─────────────────────────────────────────────
// Backend du hub rituel : défis/saisons, sprints en direct, séries de jours,
// mur d'encouragements et cercles d'affinité. Stockage : data/foyer/*.json
// dans le dépôt (même modèle que /api/github-db).

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

const DIR = "data/foyer";
const FILES = {
  challenges: "challenges.json",
  sprints: "sprints.json",
  mur: "mur.json",
  cercles: "cercles.json",
  rituels: "rituels.json"
};

async function getFile(path) {
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
    if (Array.isArray(data) || !data.content) return null;
    const b64 = data.content.replace(/\s/g, '');
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return { content: JSON.parse(decoded), sha: data.sha };
  } catch (err) {
    console.error(`[foyer] fetch error [${path}]:`, err.message);
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encoded = btoa(binString);
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Lisible-App'
      },
      body: JSON.stringify({ message: `[FOYER] ${message} [skip ci]`, content: encoded, sha: sha || undefined })
    });
    return res.ok;
  } catch (err) {
    console.error(`[foyer] update error [${path}]:`, err.message);
    return false;
  }
}

const safeEmail = (email) => (email || "").toLowerCase().trim().replace(/[@.]/g, '_');
const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const uid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

// ─── Données initiales (créées automatiquement au premier appel) ─────────────
function seedChallenges() {
  return [
    {
      id: "saison-automne-2026",
      kind: "saison",
      title: "Saison d'automne 2026",
      description: "La grande saison d'écriture du Foyer : écrivez 50 000 mots entre le 1er octobre et le 31 décembre. Chaque jour compte, chaque mot rapproche du but.",
      goalWords: 50000,
      startDate: "2026-10-01",
      endDate: "2026-12-31",
      participants: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "defi-7-jours",
      kind: "defi",
      title: "Défi 7 jours — 500 mots par jour",
      description: "Sept jours, 500 mots par jour, zéro excuse. Le rituel parfait pour relancer une plume endormie.",
      goalWords: 3500,
      rollingDays: 7,
      participants: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "defi-premier-jet",
      kind: "defi",
      title: "Premier jet en 30 jours",
      description: "30 000 mots en 30 jours : un premier jet imparfait vaut mieux qu'une page blanche parfaite.",
      goalWords: 30000,
      rollingDays: 30,
      participants: [],
      createdAt: new Date().toISOString()
    }
  ];
}

function seedCercles() {
  const defs = [
    { id: "romanciers-aube", name: "Romanciers de l'aube", description: "Pour celles et ceux qui écrivent avant que le monde se réveille.", emoji: "🌅" },
    { id: "poetes-nocturnes", name: "Poètes nocturnes", description: "La poésie s'écrit la nuit, entre deux silences.", emoji: "🌙" },
    { id: "plumes-fantastiques", name: "Plumes fantastiques", description: "Fantasy, SF, merveilleux : les mondes imaginaires ont leur foyer.", emoji: "🐉" },
    { id: "ecrivains-dimanche", name: "Écrivains du dimanche", description: "On écrit quand on peut, mais on écrit ensemble.", emoji: "☕" },
    { id: "theatre-dialogues", name: "Théâtre & dialogues", description: "L'art du dialogue, de la scène et de la voix.", emoji: "🎭" },
    { id: "memoires-recits", name: "Mémoires & récits vrais", description: "Raconter sa vie, témoigner, transmettre.", emoji: "📖" }
  ];
  return defs.map(d => ({ ...d, members: [], createdAt: new Date().toISOString() }));
}

function seedMur() {
  const now = new Date().toISOString();
  return [
    { id: uid("kudos"), fromEmail: "equipe", fromName: "Équipe Lisible", toEmail: null, toName: "toutes les plumes", message: "Bienvenue au Foyer ! Ici, on écrit ensemble, un jour à la fois. Allumez votre flamme. 🔥", date: now },
    { id: uid("kudos"), fromEmail: "equipe", fromName: "Équipe Lisible", toEmail: null, toName: "les plumes du matin", message: "500 mots aujourd'hui, c'est 500 mots de plus qu'hier. Bravo à celles et ceux qui ont tenu leur rituel !", date: now }
  ];
}

async function loadOrSeed(key, seeder) {
  const path = `${DIR}/${FILES[key]}`;
  let file = await getFile(path);
  if (!file) {
    const seed = seeder();
    await updateFile(path, seed, null, `Init ${FILES[key]}`);
    return { content: seed, sha: null, path };
  }
  return { content: file.content, sha: file.sha, path };
}

// ─── Séries de jours ─────────────────────────────────────────────────────────
function computeRituel(entry) {
  const days = entry && Array.isArray(entry.days) ? entry.days : [];
  const byDate = {};
  days.forEach(d => { byDate[d.date] = (byDate[d.date] || 0) + Number(d.words || 0); });
  const sorted = Object.keys(byDate).sort();
  // série actuelle (jours consécutifs jusqu'à aujourd'hui ou hier)
  let streak = 0;
  const cursor = new Date();
  const t = todayKey(cursor);
  if (!byDate[t]) cursor.setDate(cursor.getDate() - 1); // tolère "hier" comme dernier jour
  while (byDate[todayKey(cursor)] > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  // 7 derniers jours pour le graphique
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = todayKey(d);
    week.push({ date: k, label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), words: byDate[k] || 0 });
  }
  const totalWords = Object.values(byDate).reduce((a, b) => a + b, 0);
  return { days: sorted.map(date => ({ date, words: byDate[date] })), streak, week, totalWords, todayWords: byDate[t] || 0 };
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const email = (searchParams.get('email') || "").toLowerCase().trim();

    if (type === 'challenges') {
      const { content } = await loadOrSeed('challenges', seedChallenges);
      return NextResponse.json({ challenges: content });
    }
    if (type === 'sprints') {
      const { content } = await loadOrSeed('sprints', () => []);
      const now = Date.now();
      let changed = false;
      const sprints = content.map(s => {
        const end = new Date(s.startAt).getTime() + s.durationMin * 60000;
        if (s.status !== 'done' && now > end + 15 * 60000) { s.status = 'done'; changed = true; }
        else if (s.status === 'scheduled' && now >= new Date(s.startAt).getTime()) { s.status = 'live'; changed = true; }
        return s;
      });
      if (changed) {
        const f = await getFile(`${DIR}/${FILES.sprints}`);
        await updateFile(`${DIR}/${FILES.sprints}`, sprints, f ? f.sha : null, "Sprint status sync");
      }
      const actives = sprints.filter(s => s.status !== 'done').sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
      const done = sprints.filter(s => s.status === 'done').sort((a, b) => new Date(b.startAt) - new Date(a.startAt)).slice(0, 5);
      return NextResponse.json({ sprints: [...actives, ...done] });
    }
    if (type === 'mur') {
      const { content } = await loadOrSeed('mur', seedMur);
      return NextResponse.json({ mur: content.slice(0, 40) });
    }
    if (type === 'cercles') {
      const { content } = await loadOrSeed('cercles', seedCercles);
      return NextResponse.json({ cercles: content });
    }
    if (type === 'rituel') {
      if (!email) return NextResponse.json({ error: "email requis" }, { status: 400 });
      const { content } = await loadOrSeed('rituels', () => ({}));
      return NextResponse.json({ rituel: computeRituel(content[email] || { days: [] }) });
    }
    return NextResponse.json({ error: "type inconnu" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
    const body = await req.json();
    const { action, userEmail, userName, ...data } = body;
    const email = (userEmail || "").toLowerCase().trim();
    const name = userName || "Plume anonyme";

    const needAuth = !['ping'].includes(action);
    if (needAuth && !email) return NextResponse.json({ error: "Connectez-vous pour participer au Foyer." }, { status: 401 });

    // — Rejoindre un défi / une saison —
    if (action === 'join_challenge') {
      const { content, sha, path } = await loadOrSeed('challenges', seedChallenges);
      const ch = content.find(c => c.id === data.challengeId);
      if (!ch) return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
      if (!ch.participants.some(p => p.email === email)) {
        ch.participants.push({ email, name, joinedAt: new Date().toISOString() });
        await updateFile(path, content, sha, `Join challenge ${ch.id} (${email})`);
      }
      return NextResponse.json({ success: true, challenge: ch });
    }

    // — Enregistrer les mots du jour (série de jours) —
    if (action === 'log_day') {
      const words = Math.max(0, Math.min(100000, Number(data.words) || 0));
      const date = /^\d{4}-\d{2}-\d{2}$/.test(data.date || "") ? data.date : todayKey();
      const { content, sha, path } = await loadOrSeed('rituels', () => ({}));
      const entry = content[email] || { name, days: [] };
      entry.name = name;
      const existing = entry.days.find(d => d.date === date);
      if (existing) existing.words = Number(existing.words || 0) + words;
      else entry.days.push({ date, words });
      content[email] = entry;
      await updateFile(path, content, sha, `Rituel ${email} +${words} mots`);
      return NextResponse.json({ success: true, rituel: computeRituel(entry) });
    }

    // — Créer un sprint —
    if (action === 'create_sprint') {
      const durationMin = [10, 15, 25, 45, 60].includes(Number(data.durationMin)) ? Number(data.durationMin) : 25;
      const startsInMin = Math.max(0, Math.min(120, Number(data.startsInMin) || 0));
      const title = String(data.title || "Sprint d'écriture").slice(0, 80);
      const { content, sha, path } = await loadOrSeed('sprints', () => []);
      const startAt = new Date(Date.now() + startsInMin * 60000).toISOString();
      const sprint = {
        id: uid("sprint"),
        title,
        durationMin,
        startAt,
        status: startsInMin === 0 ? 'live' : 'scheduled',
        host: email,
        hostName: name,
        participants: [{ email, name, words: null, joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      };
      content.unshift(sprint);
      await updateFile(path, content.slice(0, 60), sha, `Sprint créé: ${title}`);
      return NextResponse.json({ success: true, sprint });
    }

    // — Rejoindre un sprint —
    if (action === 'join_sprint') {
      const { content, sha, path } = await loadOrSeed('sprints', () => []);
      const s = content.find(x => x.id === data.sprintId);
      if (!s) return NextResponse.json({ error: "Sprint introuvable" }, { status: 404 });
      if (s.status === 'done') return NextResponse.json({ error: "Ce sprint est terminé." }, { status: 400 });
      if (!s.participants.some(p => p.email === email)) {
        s.participants.push({ email, name, words: null, joinedAt: new Date().toISOString() });
        await updateFile(path, content, sha, `Join sprint ${s.id}`);
      }
      return NextResponse.json({ success: true, sprint: s });
    }

    // — Déclarer ses mots à la fin d'un sprint —
    if (action === 'declare_words') {
      const words = Math.max(0, Math.min(50000, Number(data.words) || 0));
      const { content, sha, path } = await loadOrSeed('sprints', () => []);
      const s = content.find(x => x.id === data.sprintId);
      if (!s) return NextResponse.json({ error: "Sprint introuvable" }, { status: 404 });
      const p = s.participants.find(x => x.email === email);
      if (!p) return NextResponse.json({ error: "Vous ne participez pas à ce sprint." }, { status: 403 });
      p.words = words;
      p.finishedAt = new Date().toISOString();
      await updateFile(path, content, sha, `Sprint ${s.id}: ${words} mots (${email})`);
      // Les mots du sprint alimentent aussi la série du jour
      const r = await loadOrSeed('rituels', () => ({}));
      const entry = r.content[email] || { name, days: [] };
      entry.name = name;
      const dk = todayKey();
      const ex = entry.days.find(d => d.date === dk);
      if (ex) ex.words = Number(ex.words || 0) + words;
      else entry.days.push({ date: dk, words });
      r.content[email] = entry;
      await updateFile(r.path, r.content, r.sha, `Rituel sprint ${email} +${words}`);
      return NextResponse.json({ success: true, sprint: s });
    }

    // — Envoyer un encouragement —
    if (action === 'send_kudos') {
      const message = String(data.message || "").slice(0, 280).trim();
      if (!message) return NextResponse.json({ error: "Écrivez un mot d'encouragement." }, { status: 400 });
      const toEmail = (data.toEmail || "").toLowerCase().trim() || null;
      const toName = String(data.toName || "toute la communauté").slice(0, 60);
      const { content, sha, path } = await loadOrSeed('mur', seedMur);
      const kudos = { id: uid("kudos"), fromEmail: email, fromName: name, toEmail, toName, message, date: new Date().toISOString() };
      content.unshift(kudos);
      await updateFile(path, content.slice(0, 120), sha, `Kudos de ${email}`);
      // Notification si un destinataire précis
      if (toEmail) {
        const uPath = `data/users/${safeEmail(toEmail)}.json`;
        const uFile = await getFile(uPath);
        if (uFile) {
          uFile.content.notifications = uFile.content.notifications || [];
          uFile.content.notifications.unshift({
            id: `kudos_${Date.now()}`,
            type: "kudos",
            message: `${name} vous envoie un encouragement du Foyer 🔥`,
            description: message,
            date: new Date().toISOString(),
            read: false
          });
          await updateFile(uPath, uFile.content, uFile.sha, `Kudos notif ${toEmail}`);
        }
      }
      return NextResponse.json({ success: true, kudos });
    }

    // — Rejoindre / quitter un cercle —
    if (action === 'join_cercle' || action === 'leave_cercle') {
      const { content, sha, path } = await loadOrSeed('cercles', seedCercles);
      const c = content.find(x => x.id === data.cercleId);
      if (!c) return NextResponse.json({ error: "Cercle introuvable" }, { status: 404 });
      c.members = c.members || [];
      if (action === 'join_cercle') {
        if (!c.members.some(m => m.email === email)) c.members.push({ email, name, joinedAt: new Date().toISOString() });
      } else {
        c.members = c.members.filter(m => m.email !== email);
      }
      await updateFile(path, content, sha, `${action} ${c.id} (${email})`);
      return NextResponse.json({ success: true, cercle: c });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
