// app/sitemap.xml/route.js

// Ajout pour la compatibilité Cloudflare Pages (Edge Runtime)
export const runtime = 'edge';

export async function GET() {
  const baseUrl = "https://lisible.biz";

  try {
    // 1. Récupérer la liste des manuscrits depuis votre API
    const res = await fetch(`${baseUrl}/api/github-db?type=library`, { 
      next: { revalidate: 3600 } // Cache d'une heure pour éviter de surcharger l'API GitHub
    });
    const data = await res.json();
    const texts = data?.content || [];

    // 2. Définir les pages statiques principales
    const staticPages = [
      "",
      "/bibliotheque",
      "/cercle",
      "/concours",
    ].map(route => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString(),
      changefreq: "daily",
      priority: route === "" ? 1.0 : 0.8
    }));

    // 3. Ajouter les pages dynamiques des textes
    const dynamicPages = texts.map(text => ({
      url: `${baseUrl}/texts/${text.id}`,
      lastModified: new Date(text.date || Date.now()).toISOString(),
      changefreq: "weekly",
      priority: 0.6
    }));

    const allPages = [...staticPages, ...dynamicPages];

    // 4. Générer le XML (Format compact sans espaces inutiles)
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join('')}
</urlset>`.trim();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', { 
      status: 200, // On renvoie un sitemap vide au lieu d'une erreur 500 pour ne pas effrayer les bots
      headers: { 'Content-Type': 'application/xml' } 
    });
  }
}
