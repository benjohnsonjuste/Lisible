import { NextResponse } from 'next/server';

export function middleware(request) {
  return NextResponse.next();
}

// Cette ligne est la clé du succès pour Cloudflare
export const runtime = 'edge';
