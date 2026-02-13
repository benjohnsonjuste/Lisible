import { NextResponse } from 'next/server';

export function middleware(request) {
  // On laisse passer toutes les requêtes pour l'instant
  return NextResponse.next();
}

// Utilise le flag standard reconnu par Cloudflare et Next.js 14+
export const config = {
  runtime: 'edge',
};
