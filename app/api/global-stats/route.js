// app/api/global-stats/route.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "benjohnsonjuste";
const REPO = "Lisible";

export async function GET() {
  try {
    const { data: files } = await octokit.repos.getContent({ 
      owner: OWNER, 
      repo: REPO, 
      path: "data/publications" 
    });
    
    // On filtre uniquement les fichiers JSON de publications
    const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.name !== 'index.json');

    // On récupère tout pour calculer les totaux
    const promises = jsonFiles.map(f => 
        fetch(f.download_url).then(r => r.json())
    );
    const allTexts = await Promise.all(promises);

    const stats = {
      totalTexts: allTexts.length,
      totalViews: allTexts.reduce((acc, t) => acc + (Number(t.views) || 0), 0),
      totalCertified: allTexts.reduce((acc, t) => acc + (Number(t.totalCertified) || 0), 0),
      topTexts: allTexts
        .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        .slice(0, 5)
    };

    // Configuration du cache : s-maxage=3600 (1 heure sur le CDN Vercel)
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate"
      },
    });

  } catch (e) {
    console.error("Global Stats Error:", e);
    return new Response(JSON.stringify({ error: "Calcul des stats impossible" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
