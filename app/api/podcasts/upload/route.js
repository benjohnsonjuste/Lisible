import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 });
    }

    // Le fichier contient désormais le mixage filtré des deux voix (hôte + appel)
    const blob = await put(`podcasts/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: 'audio/mpeg', // Précision du type pour la lecture directe
    });

    // Renvoie l'URL du blob qui sera ensuite utilisée par l'action 'addPodcast' vers GitHub
    return NextResponse.json({ url: blob.url });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
