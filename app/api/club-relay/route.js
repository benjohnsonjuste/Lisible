import { NextResponse } from 'next/server';

// Cache en mémoire vive (RAM)
const liveSessions = new Map();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const liveId = searchParams.get('liveId');
  const action = searchParams.get('action');

  if (!liveId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const session = liveSessions.get(liveId) || { comments: [], reactions: 0, viewers: 1 };

  if (action === 'get-final-data') {
    return NextResponse.json(session);
  }

  return NextResponse.json(session);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, liveId, comment, user } = body;

    // Validation stricte : ce relais de chat live est public (spectateurs
    // anonymes autorisés), mais les entrées doivent être valides.
    const ACTIONS = new Set(['comment', 'react', 'join']);
    if (typeof liveId !== 'string' || !liveId.trim()) {
      return NextResponse.json({ error: "liveId manquant ou invalide" }, { status: 400 });
    }
    if (!ACTIONS.has(action)) {
      return NextResponse.json({ error: "action invalide" }, { status: 400 });
    }
    const cleanLiveId = liveId.trim().slice(0, 120);

    if (!liveSessions.has(cleanLiveId)) {
      liveSessions.set(cleanLiveId, { comments: [], reactions: 0, viewers: 1 });
    }

    const current = liveSessions.get(cleanLiveId);

    if (action === 'comment') {
      const text = typeof comment === 'string' ? comment.trim().slice(0, 500) : '';
      if (!text) {
        return NextResponse.json({ error: "commentaire vide" }, { status: 400 });
      }
      const userName = typeof user?.name === 'string' && user.name.trim()
        ? user.name.trim().slice(0, 80)
        : 'Anonyme';
      const avatar = typeof user?.avatar === 'string' ? user.avatar.slice(0, 500) : null;
      current.comments.push({
        id: Date.now(),
        text,
        user: userName,
        avatar,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      if (current.comments.length > 50) current.comments.shift();
    }

    if (action === 'react') current.reactions += 1;
    if (action === 'join') current.viewers += 1;

    liveSessions.set(cleanLiveId, current);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
