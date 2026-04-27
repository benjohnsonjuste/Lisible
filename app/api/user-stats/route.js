import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // 1. Récupération des données utilisateur (Solde Li, Followers)
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/github-db?type=user&id=${encodeURIComponent(email)}`);
    const userData = userRes.ok ? (await userRes.json()).content : null;

    if (!userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // 2. Récupération de la bibliothèque globale pour compter les textes et les vues
    const libraryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/github-db?type=library`);
    let authorWorks = [];

    if (libraryRes.ok) {
      const libraryData = await libraryRes.json();
      const allWorks = libraryData.content || [];
      
      // Filtrage des œuvres appartenant à l'auteur
      authorWorks = allWorks.filter(w => 
        w.authorEmail?.toLowerCase().trim() === email
      );
    }

    // 3. Agrégation des statistiques finales
    const stats = {
      profile: {
        name: userData.penName || userData.name,
        liBalance: Number(userData.li || 0),
        followers: userData.followers?.length || 0,
        following: userData.following?.length || 0,
        isCertified: userData.isCertified || false
      },
      publications: {
        count: authorWorks.length,
        totalViews: authorWorks.reduce((acc, w) => acc + Number(w.views || 0), 0),
        totalCertified: authorWorks.reduce((acc, w) => acc + Number(w.certified || 0), 0)
      },
      works: authorWorks // On renvoie la liste filtrée pour le composant MesManuscrits
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Erreur API Stats:", error);
    return NextResponse.json({ error: "Erreur lors du calcul des statistiques" }, { status: 500 });
  }
}
