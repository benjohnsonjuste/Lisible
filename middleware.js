import { NextResponse } from 'next/server';

export function middleware(request) {
  return NextResponse.next();
}

// Correction demandée par ton build
export const runtime = 'experimental-edge';
