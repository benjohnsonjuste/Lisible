import { NextResponse } from "next/server";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/studio/sessions-duo.json";

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;

async function triggerPusher(channel, event, data) {
  try {
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) return;
    const Pusher = (await import("pusher")).default;
    const pusher = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: "us2",
      useTLS: true,
    });
    await pusher.trigger(channel, event, data);
  } catch (e) {
    console.error("Pusher trigger error:", e.message);
  }
}

async function readStore() {
  try {
    const res = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Cache-Control": "no-cache",
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Lisible-Studio/1.0",
      },
      next: { revalidate: 0 },
    });
    if (res.status === 404) return { sha: null, sessions: {} };
    if (!res.ok) throw new Error("GitHub read error");
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return { sha: data.sha, sessions: content.sessions || {} };
  } catch (e) {
    console.error("readStore:", e.message);
    return { sha: null, sessions: {} };
  }
}

async function writeStore(sessions, sha, message) {
  const getRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.v3+json", "User-Agent": "Lisible-Studio/1.0" },
    cache: "no-store",
  });
  let currentSha = sha;
  if (getRes.ok) currentSha = (await getRes.json()).sha;

  const b64 = Buffer.from(JSON.stringify({ sessions }, null, 2)).toString("base64");
  const putRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
        "User-Agent": "Lisible-Studio/1.0",
    },
    body: JSON.stringify({ message, content: b64, sha: currentSha || undefined }),
  });
  if (!putRes.ok) {
    const t = await putRes.text();
    throw new Error("GitHub write error: " + t.slice(0, 200));
  }
}

function publicSession(s) {
  if (!s) return null;
  return {
    id: s.id,
    titre: s.titre,
    hote: s.hote,
    instrumentalId: s.instrumentalId,
    statut: s.statut,
    invites: s.invites || [],
    createdAt: s.createdAt,
    episode: s.episode || null,
  };
}

function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { sessions } = await readStore();
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const s = sessions[id];
  if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  return NextResponse.json({ session: publicSession(s) });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;
    const { sha, sessions } = await readStore();

    // --- Créer une session (hôte connecté) ---
    if (action === "creer") {
      const { titre, email, nom } = body;
      if (!email) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
      const id = newId();
      sessions[id] = {
        id,
        titre: (titre || "").trim().slice(0, 120) || `Duo de ${nom || "l'hôte"}`,
        hote: { email: email.toLowerCase(), nom: nom || "Hôte" },
        instrumentalId: null,
        statut: "attente",
        invites: [],
        createdAt: new Date().toISOString(),
        episode: null,
      };
      await writeStore(sessions, sha, `🎙️ Duo: nouvelle session ${id}`);
      return NextResponse.json({ success: true, session: publicSession(sessions[id]) });
    }

    // --- Choisir l'instrumental (hôte) ---
    if (action === "instrumental") {
      const { id, email, instrumentalId } = body;
      const s = sessions[id];
      if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      if (s.hote.email !== String(email || "").toLowerCase())
        return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });
      s.instrumentalId = instrumentalId || null;
      await writeStore(sessions, sha, `🎙️ Duo ${id}: instrumental ${instrumentalId}`);
      await triggerPusher(`duo-${id}`, "instrumental", { instrumentalId: s.instrumentalId });
      return NextResponse.json({ success: true, session: publicSession(s) });
    }

    // --- Un invité rejoint (max 2) ---
    if (action === "rejoindre") {
      const { id, nom } = body;
      const s = sessions[id];
      if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      if (s.statut === "terminee")
        return NextResponse.json({ error: "Session terminée" }, { status: 410 });
      const cleanNom = (nom || "").trim().slice(0, 60) || "Invité";
      if (!s.invites.find((i) => i.nom === cleanNom)) {
        if (s.invites.length >= 2)
          return NextResponse.json({ error: "Session complète (2 invités max)" }, { status: 409 });
        s.invites.push({ nom: cleanNom, statut: "connecte", joinedAt: new Date().toISOString() });
      }
      await writeStore(sessions, sha, `🎙️ Duo ${id}: ${cleanNom} rejoint`);
      await triggerPusher(`duo-${id}`, "invite-rejoint", { nom: cleanNom, invites: s.invites });
      return NextResponse.json({ success: true, session: publicSession(s) });
    }

    // --- Un invité quitte ---
    if (action === "quitter") {
      const { id, nom } = body;
      const s = sessions[id];
      if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      s.invites = (s.invites || []).filter((i) => i.nom !== nom);
      await writeStore(sessions, sha, `🎙️ Duo ${id}: ${nom} quitte`);
      await triggerPusher(`duo-${id}`, "invite-quitte", { nom, invites: s.invites });
      return NextResponse.json({ success: true, session: publicSession(s) });
    }

    // --- Démarrer l'enregistrement (hôte) ---
    if (action === "demarrer") {
      const { id, email } = body;
      const s = sessions[id];
      if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      if (s.hote.email !== String(email || "").toLowerCase())
        return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });
      s.statut = "enregistrement";
      s.startedAt = new Date().toISOString();
      await writeStore(sessions, sha, `🎙️ Duo ${id}: enregistrement démarré`);
      await triggerPusher(`duo-${id}`, "enregistrement-demarre", { at: s.startedAt });
      return NextResponse.json({ success: true, session: publicSession(s) });
    }

    // --- Terminer (hôte) + épisode archivé ---
    if (action === "terminer") {
      const { id, email, episode } = body;
      const s = sessions[id];
      if (!s) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      if (s.hote.email !== String(email || "").toLowerCase())
        return NextResponse.json({ error: "Réservé à l'hôte" }, { status: 403 });
      s.statut = "terminee";
      s.endedAt = new Date().toISOString();
      if (episode) s.episode = episode;
      await writeStore(sessions, sha, `🎙️ Duo ${id}: session terminée`);
      await triggerPusher(`duo-${id}`, "session-terminee", { episode: s.episode || null });
      return NextResponse.json({ success: true, session: publicSession(s) });
    }

    // --- Relais de signalisation WebRTC (offre/réponse/ICE) ---
    if (action === "signal") {
      const { id, from, to, payload } = body;
      if (!sessions[id]) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
      await triggerPusher(`duo-${id}`, "signal", { from, to, payload });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("studio-duo:", e.message);
    return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
  }
}
