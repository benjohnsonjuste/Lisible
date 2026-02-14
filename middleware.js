import { NextResponse } from 'next/server';

export function middleware(request) {
  // On laisse passer toutes les requêtes pour l'instant
  return NextResponse.next();
}

// Correction du flag runtime pour éviter l'erreur de build
export const config = {
  runtime: 'experimental-edge',
};
