import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: "Méthode non autorisée" });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Récupérer la liste de tous les manuscrits (data/publications)
    const { data: files } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/publications"
    });

    const jsonFiles = files.filter(f => f.name.endsWith('.json'));

    // 2. Récupérer le contenu de chaque manuscrit en parallèle
    const textPromises = jsonFiles.map(async (file) => {
      try {
        const { data: contentData } = await octokit.repos.getContent({
          owner: "benjohnsonjuste",
          repo: "Lisible",
          path: file.path
        });
        return JSON.parse(Buffer.from(contentData.content, "base64").toString());
      } catch (e) {
        return null; // Évite de bloquer tout le processus si un fichier est corrompu
      }
    });

    const allTexts = (await Promise.all(textPromises)).filter(t => t !== null);

    // 3. Filtrer les textes appartenant à cet auteur
    const userTexts = allTexts.filter(t => 
      t.authorEmail && t.authorEmail.trim().toLowerCase() === cleanEmail
    );

    // 4. Calculer les métriques globales
    const rawStats = userTexts.reduce((acc, curr) => {
      return {
        totalViews: acc.totalViews + (Number(curr.views) || 0),
        totalLikes: acc.totalLikes + (curr.likes?.length || 0),
        totalTexts: acc.totalTexts + 1
      };
    }, { totalViews: 0, totalLikes: 0, totalTexts: 0 });

    // 5. Calcul des revenus (0.20 USD pour 1000 vues)
    // Formule : (Vues / 1000) * 0.20
    const estimatedEarnings = (rawStats.totalViews / 1000) * 0.20;

    // 6. Renvoyer les données complètes
    res.status(200).json({
      ...rawStats,
      estimatedEarnings: estimatedEarnings.toFixed(2), // Formaté à 2 décimales (ex: "1.40")
      currency: "USD",
      rate: "0.20/1000 views"
    });

  } catch (error) {
    console.error("Erreur API Stats:", error);
    res.status(200).json({ 
      totalViews: 0, 
      totalLikes: 0, 
      totalTexts: 0,
      estimatedEarnings: "0.00",
      message: "Initialisation ou auteur introuvable" 
    });
  }
}
