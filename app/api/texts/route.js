import { revalidatePath } from "next/cache";

export default async function handler(req, res) {
  const { method, query } = req;

  if (method === "GET") {
    try {
      // 1. Récupérer tout l'index (via GitHub ou votre DB)
      const githubRes = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`, {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      });
      const fileData = await githubRes.json();
      const allTexts = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

      // 2. Logique de Pagination
      const limit = parseInt(query.limit) || 10;
      const cursor = query.cursor; // ID du dernier texte chargé
      
      let startIndex = 0;
      if (cursor) {
        startIndex = allTexts.findIndex(t => t.id === cursor) + 1;
      }

      const paginatedTexts = allTexts.slice(startIndex, startIndex + limit);
      const nextCursor = paginatedTexts.length === limit ? paginatedTexts[paginatedTexts.length - 1].id : null;

      return res.status(200).json({
        data: paginatedTexts,
        nextCursor,
        total: allTexts.length
      });
    } catch (e) {
      return res.status(500).json({ error: "Erreur de chargement" });
    }
  }
  
  // ... reste de vos méthodes PATCH (like, comment)
}
