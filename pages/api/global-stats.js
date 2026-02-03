// pages/api/global-stats.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "benjohnsonjuste";
const REPO = "Lisible";

export default async function handler(req, res) {
  try {
    const { data: files } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: "data/publications" });
    
    // On récupère tout pour calculer les totaux
    const promises = files.filter(f => f.name.endsWith('.json')).map(f => 
        fetch(f.download_url).then(r => r.json())
    );
    const allTexts = await Promise.all(promises);

    const stats = {
      totalTexts: allTexts.length,
      totalViews: allTexts.reduce((acc, t) => acc + (t.views || 0), 0),
      totalCertified: allTexts.reduce((acc, t) => acc + (t.totalCertified || 0), 0),
      topTexts: allTexts.sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
    };

    // Cache les stats pendant 1 heure pour éviter de spammer GitHub
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(stats);
  } catch (e) {
    return res.status(500).json({ error: "Calcul des stats impossible" });
  }
}
