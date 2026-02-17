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
    const body = await req.json();
    const { action, liveId, comment, user } = body;

    if (!liveSessions.has(liveId)) {
      liveSessions.set(liveId, { comments: [], reactions: 0, viewers: 1 });
    }

    const current = liveSessions.get(liveId);

    if (action === 'comment') {
      current.comments.push({
        id: Date.now(),
        text: comment,
        user: user.name,
        avatar: user.avatar,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      if (current.comments.length > 50) current.comments.shift();
    }

    if (action === 'react') current.reactions += 1;
    if (action === 'join') current.viewers += 1;

    liveSessions.set(liveId, current);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
