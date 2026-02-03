import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  const { query, category } = req.query;

  try {
    const { data: files } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/publications",
    });

    const promises = files
      .filter(f => f.name.endsWith('.json'))
      .map(f => fetch(f.download_url).then(r => r.json()));

    let allTexts = await Promise.all(promises);

    // Filtrage intelligent
    if (query) {
      allTexts = allTexts.filter(t => 
        t.title?.toLowerCase().includes(query.toLowerCase()) || 
        t.penName?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category && category !== "Toutes") {
      allTexts = allTexts.filter(t => t.category === category);
    }

    res.status(200).json(allTexts.slice(0, 20)); // Renvoie les 20 premiers résultats
  } catch (e) {
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
}
