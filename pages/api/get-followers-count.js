import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  // Désactiver le cache au niveau du navigateur/CDN pour cette API
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { authorId } = req.query;

    if (!authorId) {
      return res.status(400).json({ error: "ID auteur manquant." });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const path = `data/users/${authorId}.json`;

    try {
      // AJOUT : On demande le contenu avec un timestamp pour forcer GitHub à bypasser son cache interne
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        headers: {
          'If-None-Match': '', // Force la revalidation
        },
        // On ajoute un paramètre bidon dans la query si nécessaire (via ref)
        ref: 'main' 
      });

      const content = JSON.parse(
        Buffer.from(data.content, "base64").toString("utf-8")
      );

      // Sécurité : s'assurer que subscribers est bien un tableau
      const followersCount = Array.isArray(content.subscribers) ? content.subscribers.length : 0;
      
      return res.status(200).json({ followersCount });

    } catch (err) {
      if (err.status === 404) {
        return res.status(200).json({ followersCount: 0 });
      }
      throw err;
    }
  } catch (error) {
    console.error("Erreur /api/get-followers-count :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
