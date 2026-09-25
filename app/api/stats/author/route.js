import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
  }

  try {
    // Index des publications sur GitHub (le système de fichiers local n'existe
    // pas dans l'environnement Cloudflare Workers).
    const res = await fetch(
      'https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/index.json',
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`Index des publications inaccessible (HTTP ${res.status})`);
    const publications = await res.json();
    const list = Array.isArray(publications) ? publications : [];

    // Initialisation des compteurs
    let stats = {
      totalViews: 0,
      totalLikes: 0,
      totalCertified: 0,
      textCount: 0,
    };

    // Filtrage et calcul des données de l'auteur
    const cleanEmail = email.toLowerCase().trim();
    list.forEach((item) => {
      if ((item.authorEmail || "").toLowerCase().trim() === cleanEmail) {
        stats.totalViews += Number(item.views || 0);
        stats.totalLikes += Number(item.likes || 0);
        stats.totalCertified += Number(item.certified || 0);
        stats.textCount += 1;
      }
    });

    return NextResponse.json({
      success: true,
      authorEmail: email,
      stats: stats
    });

  } catch (error) {
    console.error("Erreur calcul stats auteur:", error);
    return NextResponse.json({
      success: false,
      error: "Impossible de récupérer les statistiques"
    }, { status: 500 });
  }
}
