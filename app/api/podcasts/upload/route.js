import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const hostEmail = formData.get('host');
    const title = formData.get('title') || `Podcast du ${new Date().toLocaleDateString()}`;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio trouvé" }, { status: 400 });
    }

    // 1. Upload du fichier binaire vers Vercel Blob
    // Le fichier est stocké sur les serveurs de Vercel (car GitHub est limité pour le binaire)
    const blob = await put(`podcasts/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // 2. Enregistrement des métadonnées dans votre GitHub-DB (JSON)
    // On simule l'appel à votre API interne github-db pour garder une trace
    const metadataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/github-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addPodcast',
        type: 'podcasts',
        content: {
          id: crypto.randomUUID(),
          title: title,
          audioUrl: blob.url, // L'URL publique générée par Vercel
          hostEmail: hostEmail,
          createdAt: new Date().toISOString(),
          duration: "30:00" // Idéalement calculé côté client
        }
      })
    });

    if (!metadataResponse.ok) {
      throw new Error("Impossible d'enregistrer les métadonnées dans le JSON");
    }

    return NextResponse.json({ 
      success: true, 
      url: blob.url 
    });

  } catch (error) {
    console.error("Erreur Upload Podcast:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
