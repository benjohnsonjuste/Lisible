import { NextResponse } from "next/server";
import { getSessionUser } from "../_lib/session.js";

const GITHUB_API_URL = "https://api.github.com/repos";
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "data/lives.json";

const LIVE_DURATION_MS = 15 * 60 * 1000; // 15 minutes pour l'instant

// Vérifie le jeton de session client et retourne l'utilisateur connecté,
// ou null si le jeton est absent, invalide ou expiré.
async function requireUser(sessionToken) {
  if (!sessionToken) return null;
  try {
    const s = await getSessionUser(sessionToken);
    return s && s.email ? s : null;
  } catch {
    return null;
  }
}
const SESSION_REQUISE = { error: "Session requise. Reconnectez-vous." };

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

function sanitizeChannel(email) {
  return `live-invite-${String(email || "").toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function publicLive(live) {
  if (!live) return null;
  const { streamKey, ...rest } = live;
  const clean = { ...rest };
  if (clean.guest) {
    const { streamKey: _gk, ...g } = clean.guest;
    clean.guest = g;
  }
  return clean;
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
    if (res.status === 404) return { sha: null, lives: {} };
    if (!res.ok) throw new Error("GitHub read error");
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return { sha: data.sha, lives: content.lives || {} };
  } catch (e) {
    console.error("readStore:", e.message);
    return { sha: null, lives: {} };
  }
}

async function writeStore(lives, sha, message) {
  const getRes = await fetch(`${GITHUB_API_URL}/${REPO}/contents/${FILE_PATH}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.v3+json", "User-Agent": "Lisible-Studio/1.0" },
    cache: "no-store",
  });
  let currentSha = sha;
  if (getRes.ok) currentSha = (await getRes.json()).sha;

  const b64 = Buffer.from(JSON.stringify({ lives }, null, 2)).toString("base64");
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
  return putRes.ok;
}

function isExpired(live) {
  if (!live || live.status !== "live") return false;
  return Date.now() > new Date(live.endsAt).getTime();
}

// Cache mémoire pour la liste des utilisateurs (5 min)
let usersCache = { at: 0, list: [] };

async function getCompactUsers() {
  if (Date.now() - usersCache.at < 5 * 60 * 1000 && usersCache.list.length) {
    return usersCache.list;
  }
  try {
    const listRes = await fetch(
      `${GITHUB_API_URL}/${REPO}/contents/data/users`,
      { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github.v3+json", "User-Agent": "Lisible-Studio/1.0" }, cache: "no-store" }
    );
    if (!listRes.ok) return usersCache.list;
    const files = await listRes.json();
    const batch = files.filter((f) => f.name.endsWith(".json")).slice(0, 10);
    const results = await Promise.all(
      batch.map(async (f) => {
        try {
          const r = await fetch(f.download_url, { cache: "no-store" });
          if (!r.ok) return null;
          const u = await r.json();
          if (!u.email || u.status === "deleted") return null;
          return { email: String(u.email).toLowerCase(), name: u.penName || u.name || "Plume", avatar: u.avatar || u.photoURL || null };
        } catch {
          return null;
        }
      })
    );
    const list = results.filter(Boolean);
    list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    usersCache = { at: Date.now(), list };
    return list;
  } catch (e) {
    console.error("getCompactUsers:", e.message);
    return usersCache.list;
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const host = searchParams.get("host");
  const invites = searchParams.get("invites");
  const wantUsers = searchParams.get("users");

  if (wantUsers) {
    const list = await getCompactUsers();
    return NextResponse.json({ users: list });
  }

  const { sha, lives } = await readStore();
  let changed = false;

  // Expiration paresseuse : on clôture les lives dépassés à la lecture
  for (const key of Object.keys(lives)) {
    if (isExpired(lives[key])) {
      lives[key].status = "ended";
      lives[key].endedAt = new Date().toISOString();
      changed = true;
    }
  }
  if (changed) await writeStore(lives, sha, "⏱️ Expiration automatique des lives");

  if (id) {
    const live = lives[id];
    if (!live) return NextResponse.json({ live: null });
    return NextResponse.json({ live: publicLive(live) });
  }

  if (host) {
    const email = host.toLowerCase();
    const live = Object.values(lives).find((l) => l.hostEmail === email && l.status === "live");
    return NextResponse.json({ live: live || null });
  }

  if (invites) {
    const email = invites.toLowerCase();
    const pending = Object.values(lives)
      .filter((l) => l.status === "live" && l.guest && l.guest.email === email && l.guest.status === "invited")
      .map(publicLive);
    return NextResponse.json({ invites: pending });
  }

  // Liste des lives en cours (public, sans clés)
  const active = Object.values(lives)
    .filter((l) => l.status === "live")
    .map(publicLive)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  return NextResponse.json({ lives: active });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ---- Créer un flux Livepeer côté serveur (la clé API ne quitte jamais le serveur) ----
    if (action === "create-stream") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const key = process.env.LIVEPEER_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "Service de live non configuré. L'administrateur doit ajouter la clé Livepeer." },
          { status: 503 }
        );
      }
      try {
        const r = await fetch("https://livepeer.studio/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ name: body.name || `Live-${Date.now()}`, record: false }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = data?.errors?.[0] || data?.error || "Service de live indisponible";
          return NextResponse.json({ error: msg }, { status: 502 });
        }
        if (!data.streamKey || !data.playbackId) {
          return NextResponse.json({ error: "Réponse invalide du service de live" }, { status: 502 });
        }
        return NextResponse.json({ streamKey: data.streamKey, playbackId: data.playbackId });
      } catch {
        return NextResponse.json({ error: "Service de live injoignable" }, { status: 502 });
      }
    }

    const { sha, lives } = await readStore();

    // ---- Créer un live ----
    if (action === "create") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { name, avatar, title, type, playbackId, streamKey } = body;
      if (!playbackId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
      const clean = (session.email || "").toLowerCase();
      const existing = Object.values(lives).find((l) => l.hostEmail === clean && l.status === "live");
      if (existing) return NextResponse.json({ error: "Vous avez déjà un live en cours", live: existing }, { status: 409 });

      const id = `live_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
      const now = Date.now();
      const live = {
        id,
        hostEmail: clean,
        hostName: name || "Plume",
        hostAvatar: avatar || null,
        title: (title || "Live").slice(0, 120),
        type: type === "audio" ? "audio" : "video",
        playbackId,
        streamKey: streamKey || null,
        status: "live",
        startedAt: new Date(now).toISOString(),
        endsAt: new Date(now + LIVE_DURATION_MS).toISOString(),
        guest: null,
        endedAt: null,
      };
      lives[id] = live;
      const ok = await writeStore(lives, sha, `🔴 Live démarré : ${live.title}`);
      if (!ok) return NextResponse.json({ error: "Erreur GitHub" }, { status: 500 });
      return NextResponse.json({ live });
    }

    // ---- Terminer un live (hôte) ----
    if (action === "end") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { liveId } = body;
      const live = lives[liveId];
      if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
      if (live.hostEmail !== (session.email || "").toLowerCase())
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      live.status = "ended";
      live.endedAt = new Date().toISOString();
      await writeStore(lives, sha, `⏹️ Live terminé : ${live.title}`);
      await triggerPusher(`live-room-${liveId}`, "live-ended", { liveId });
      return NextResponse.json({ success: true });
    }

    // ---- Inviter un utilisateur comme invité ----
    if (action === "invite-guest") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { liveId, guestEmail } = body;
      const live = lives[liveId];
      if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
      if (live.hostEmail !== (session.email || "").toLowerCase())
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      if (live.status !== "live") return NextResponse.json({ error: "Live terminé" }, { status: 400 });

      const users = await getCompactUsers();
      const guest = users.find((u) => u.email === String(guestEmail).toLowerCase());
      if (!guest) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      if (guest.email === live.hostEmail)
        return NextResponse.json({ error: "Vous ne pouvez pas vous inviter vous-même" }, { status: 400 });

      live.guest = { email: guest.email, name: guest.name, avatar: guest.avatar, status: "invited", playbackId: null, streamKey: null };
      await writeStore(lives, sha, `✉️ Invité au live : ${guest.name}`);

      // Temps réel : Pusher direct vers l'invité
      await triggerPusher(sanitizeChannel(guest.email), "invite", {
        liveId,
        hostName: live.hostName,
        title: live.title,
        type: live.type,
      });
      // Notification persistante (cloche)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://lisible.biz"}/api/github-db`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_notif",
            userEmail: guest.email,
            type: "live-invite",
            title: "Invitation à un live",
            message: `${live.hostName} vous invite à participer à son live « ${live.title} ». Rendez-vous dans le Studio Live pour rejoindre l'antenne !`,
          }),
        });
      } catch (e) {
        console.error("notif error:", e.message);
      }
      return NextResponse.json({ success: true, guest: publicLive(live).guest });
    }

    // ---- Annuler une invitation ----
    if (action === "cancel-invite") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { liveId } = body;
      const live = lives[liveId];
      if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
      if (live.hostEmail !== (session.email || "").toLowerCase())
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      live.guest = null;
      await writeStore(lives, sha, `🚫 Invitation annulée sur : ${live.title}`);
      return NextResponse.json({ success: true });
    }

    // ---- L'invité passe à l'antenne ----
    if (action === "guest-start") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { liveId, playbackId, streamKey } = body;
      const live = lives[liveId];
      if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
      if (!live.guest || live.guest.email !== (session.email || "").toLowerCase() || live.guest.status !== "invited")
        return NextResponse.json({ error: "Invitation invalide" }, { status: 403 });
      if (live.status !== "live") return NextResponse.json({ error: "Live terminé" }, { status: 400 });
      live.guest.status = "live";
      live.guest.playbackId = playbackId;
      live.guest.streamKey = streamKey || null;
      await writeStore(lives, sha, `🎙️ Invité à l'antenne : ${live.guest.name}`);
      await triggerPusher(`live-room-${liveId}`, "guest-joined", {
        name: live.guest.name,
        playbackId,
        type: live.type,
      });
      return NextResponse.json({ success: true });
    }

    // ---- L'invité quitte l'antenne ----
    if (action === "guest-end") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const { liveId } = body;
      const live = lives[liveId];
      if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
      const clean = (session.email || "").toLowerCase();
      const isGuest = live.guest && live.guest.email === clean;
      const isHost = live.hostEmail === clean;
      if (!isGuest && !isHost) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      if (live.guest) {
        live.guest.status = "invited";
        live.guest.playbackId = null;
        live.guest.streamKey = null;
        await writeStore(lives, sha, `👋 Invité parti : ${live.title}`);
        await triggerPusher(`live-room-${liveId}`, "guest-left", { liveId });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
