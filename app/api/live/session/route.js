// /api/live/session/route.js
import { NextResponse } from 'next/server';

// Simulation d'une DB pour les sessions actives
let activeSessions = new Map();

export async function POST(req) {
  const { roomId, host } = await req.json();
  activeSessions.set(roomId, { host, startTime: Date.now() });
  
  return NextResponse.json({ success: true, message: "Session Live initialisée" });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  
  if (activeSessions.has(roomId)) {
    return NextResponse.json(activeSessions.get(roomId));
  }
  return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
}
