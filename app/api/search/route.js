// app/api/search/route.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function GET(req) {
  // Récupération des paramètres via l'URL
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const category = searchParams.get("category");

  try {
    const { data: files } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/publications",
    });

    // On ignore index.json pour ne pas polluer les résultats de recherche
    const publicationsFiles = files.filter(
      (f) => f.name.endsWith(".json") && f.name !== "index.json"
    );

    const promises = publicationsFiles.map((f) =>
      fetch(f.download_url).then((r) => r.json())
    );

    let allTexts = await Promise.all(promises);

    // Filtrage intelligent
    if (query) {
      const lowerQuery = query.toLowerCase();
      allTexts = allTexts.filter(
        (t) =>
          t.title?.toLowerCase().includes(lowerQuery) ||
          t.penName?.toLowerCase().includes(lowerQuery)
      );
    }

    if (category && category !== "Toutes") {
      allTexts = allTexts.filter((t) => t.category === category);
    }

    // Réponse standardisée pour le App Router
    return new Response(JSON.stringify(allTexts.slice(0, 20)), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60, stale-while-revalidate" // Cache léger pour la performance
      },
    });
  } catch (e) {
    console.error("Search API Error:", e);
    return new Response(JSON.stringify({ error: "Erreur lors de la recherche" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
