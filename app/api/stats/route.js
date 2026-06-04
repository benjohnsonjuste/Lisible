import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = "https://lisible.biz/api/realtime-data?folder=";

    // 1. Récupération simultanée de toutes les collections clés (comme sur votre arborescence)
    const [textsRes, usersRes, podcastsRes] = await Promise.all([
      fetch(`${baseUrl}texts`, { cache: 'no-store' }),
      fetch(`${baseUrl}users`, { cache: 'no-store' }),
      fetch(`https://lisible.biz/api/podcasts/register`, { cache: 'no-store' })
    ]);

    const textsData = textsRes.ok ? await textsRes.json() : { content: [] };
    const usersData = usersRes.ok ? await usersRes.json() : { content: [] };
    const podcastsData = podcastsRes.ok ? await podcastsRes.json() : { content: [] };

    const allTexts = Array.isArray(textsData.content) ? textsData.content : [];
    const allUsers = Array.isArray(usersData.content) ? usersData.content : [];
    const allPodcasts = Array.isArray(podcastsData.content) ? podcastsData.content : [];

    // 2. Calcul des métriques réelles cumulées
    let totalViews = 0;
    let totalLikes = 0;
    let totalCertified = 0;

    // Accumulation depuis les manuscrits écrits (texts)
    allTexts.forEach(text => {
      totalViews += parseInt(text.views || 0, 10);
      totalLikes += parseInt(text.likes || 0, 10);
      totalCertified += parseInt(text.certified || 0, 10);
    });

    // Accumulation depuis l'écoute des épisodes audios (podcasts.json)
    allPodcasts.forEach(podcast => {
      totalViews += parseInt(podcast.views || 0, 10);
    });

    return NextResponse.json({
      success: true,
      metrics: {
        pageViews: totalViews,
        publishedTexts: allTexts.length,
        registeredUsers: allUsers.length,
        engagement: {
          likes: totalLikes,
          certified: totalCertified
        }
      }
    });

  } catch (error) {
    console.error("Erreur API de télémétrie:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du calcul des statistiques" },
      { status: 500 }
    );
  }
}
