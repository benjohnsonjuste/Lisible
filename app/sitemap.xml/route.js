// app/sitemap.xml/route.js

// Configuration pour le Edge Runtime (Cloudflare Pages / Vercel Edge)
export const runtime = 'edge';

/**
 * Génère dynamiquement le sitemap XML pour Lisible.biz
 */
export async function GET() {
  const baseUrl = "https://lisible.biz";

  try {
    // 1. Récupération des manuscrits depuis votre API github-db
    // On ajoute un revalidate pour ne pas saturer l'API à chaque visite de robot
    const res = await fetch(`${baseUrl}/api/github-db?type=library`, { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) throw new Error("Erreur lors de la récupération des textes");
    
    const data = await res.json();
    const texts = data?.content || [];

    // 2. Pages statiques principales de Lisible
    const staticPages = [
      { route: "", priority: 1.0, freq: "daily" },           // Accueil
      { route: "/library", priority: 0.9, freq: "daily" },    // Votre bibliothèque
      { route: "/community", priority: 0.7, freq: "weekly" },    // Espace communauté
      { route: "/battle", priority: 0.8, freq: "daily" },   // Duel de Plume
    ].map(page => ({
      url: `${baseUrl}${page.route}`,
      lastModified: new Date().toISOString(),
      changefreq: page.freq,
      priority: page.priority
    }));

    // 3. Pages dynamiques des textes (Structure texts/[id])
    const dynamicPages = texts.map(text => ({
      url: `${baseUrl}/texts/${text.id}`,
      // Utilise la date du texte ou la date du jour par défaut
      lastModified: new Date(text.date || Date.now()).toISOString(),
      changefreq: "weekly",
      priority: 0.6
    }));

    const allPages = [...staticPages, ...dynamicPages];

    // 4. Construction du flux XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join('').trim()}
</urlset>`.trim();

    // 5. Retour de la réponse avec le bon Content-Type
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        // Cache côté client et proxy (1h) pour performance SEO
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error("Sitemap error:", error);
    // Fallback : On renvoie un sitemap minimaliste pour éviter une erreur 500 face aux bots
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
