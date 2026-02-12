// app/sitemap.xml/route.js
export async function GET() {
  const baseUrl = "https://lisible.biz";

  try {
    // 1. Récupérer la liste des manuscrits depuis votre API
    const res = await fetch(`${baseUrl}/api/github-db?type=library`, { cache: 'no-store' });
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
      priority: route === "" ? 1.0 : 0.8
    }));

    // 3. Ajouter les pages dynamiques des textes
    const dynamicPages = texts.map(text => ({
      url: `${baseUrl}/texts/${text.id}`,
      lastModified: new Date(text.date || Date.now()).toISOString(),
      priority: 0.6
    }));

    const allPages = [...staticPages, ...dynamicPages];

    // 4. Générer le XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${allPages.map(page => `
        <url>
          <loc>${page.url}</loc>
          <lastmod>${page.lastModified}</lastmod>
          <priority>${page.priority}</priority>
        </url>
      `).join('')}
    </urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (e) {
    return new Response("<error>Failed to generate sitemap</error>", { status: 500 });
  }
}
