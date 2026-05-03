import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

// Helper identique à ton github-db pour rester cohérent
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
    const data = await res.json();
    const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (m) => m.codePointAt(0)));
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) {
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  const encodedContent = btoa(Array.from(new TextEncoder().encode(JSON.stringify(content, null, 2)), (byte) => String.fromCodePoint(byte)).join(""));
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'Lisible-App'
      },
      body: JSON.stringify({
        message: `[PODCAST] ${message} [skip ci]`,
        content: encodedContent,
        sha: sha || undefined
      }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// --- ROUTE PRINCIPALE ---

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, podcastData, sessionData } = body;

    // ACTION : AJOUT D'UN PODCAST ENREGISTRÉ
    if (action === 'addPodcast') {
      const path = `data/podcasts.json`;
      const file = await getFile(path) || { content: [], sha: null };
      const podcasts = Array.isArray(file.content) ? file.content : [];

      podcasts.unshift({
        ...podcastData,
        createdAt: new Date().toISOString()
      });

      const success = await updateFile(path, podcasts, file.sha, `Ajout podcast: ${podcastData.title}`);
      if (success) return NextResponse.json({ success: true });
      throw new Error("Erreur lors de la mise à jour GitHub");
    }

    // ACTION : GESTION DES SESSIONS LIVE (DIRECT)
    if (action === 'createLive') {
      const path = `data/live_sessions.json`;
      const file = await getFile(path) || { content: [], sha: null };
      const sessions = Array.isArray(file.content) ? file.content : [];

      // On ajoute la session active
      sessions.unshift({
        ...sessionData,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // On ne garde que les 10 derniers lives pour ne pas surcharger le JSON
      const limitedSessions = sessions.slice(0, 10);

      const success = await updateFile(path, limitedSessions, file.sha, `Nouveau Live: ${sessionData.roomId}`);
      if (success) return NextResponse.json({ success: true, roomId: sessionData.roomId });
      throw new Error("Erreur lors de la création du Live sur GitHub");
    }

    return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'podcasts'; // podcasts ou live
    
    const fileName = type === 'live' ? 'live_sessions.json' : 'podcasts.json';
    const file = await getFile(`data/${fileName}`);
    
    return NextResponse.json(file || { content: [] });
  } catch (e) {
    return NextResponse.json({ content: [] });
  }
}
