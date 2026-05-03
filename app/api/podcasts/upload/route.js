import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 });
    }

    // On upload juste sur Vercel Blob
    const blob = await put(`podcasts/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // On renvoie juste l'URL au client
    return NextResponse.json({ url: blob.url });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}