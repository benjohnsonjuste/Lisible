import { NextResponse } from 'next/server';

// Stockage en mémoire vive (Hyper rapide, 0ms de latence)
// Ce cache est partagé entre tous les utilisateurs sur le même serveur
const liveSessions = new Map();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const liveId = searchParams.get('liveId');

  if (!liveId) return NextResponse.json({ error: "Missing liveId" }, { status: 400 });

  // Récupérer les données en mémoire
  const session = liveSessions.get(liveId) || {
    comments: [],
    reactions: 0,
    viewers: Math.floor(Math.random() * 5) + 1
  };

  return NextResponse.json(session);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, liveId, comment, user } = body;

    if (!liveSessions.has(liveId)) {
      liveSessions.set(liveId, { comments: [], reactions: 0, viewers: 1 });
    }

    const current = liveSessions.get(liveId);

    // ACTION : COMMENTAIRE ULTRA-RAPIDE
    if (action === 'comment') {
      const newMsg = {
        id: Date.now(),
        text: comment,
        user: user.name,
        avatar: user.avatar,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      
      current.comments.push(newMsg);
      // On garde les 30 derniers en mémoire
      if (current.comments.length > 30) current.comments.shift();
    }

    // ACTION : REACTION (L'effet "Coeur")
    if (action === 'react') {
      current.reactions += 1;
    }

    // ACTION : REJOINDRE
    if (action === 'join') {
      current.viewers += 1;
    }

    liveSessions.set(liveId, current);
    return NextResponse.json({ success: true, data: current });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
