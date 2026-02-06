export default async function handler(req, res) {
  const { id } = req.query; // L'ID de l'auteur (souvent son email ou UUID)

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // 1. Récupérer la liste des fichiers dans le dossier des publications
    const githubRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/posts?t=${Date.now()}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const files = await githubRes.json();

    if (!Array.isArray(files)) {
      return res.status(200).json({ works: [] });
    }

    // 2. Télécharger le contenu de chaque fichier pour filtrer par auteur
    const fetchPromises = files
      .filter(file => file.name.endsWith(".json"))
      .map(file => fetch(file.download_url).then(r => r.json()));

    const allPosts = await Promise.all(fetchPromises);

    // 3. Filtrer les textes appartenant à cet auteur
    // On vérifie soit l'authorId, soit l'email selon votre structure
    const authorWorks = allPosts.filter(
      post => post.authorId === id || post.authorEmail === id
    );

    // 4. Trier par date (du plus récent au plus ancien)
    const sortedWorks = authorWorks.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({ works: sortedWorks });
  } catch (error) {
    console.error("Erreur API Works:", error);
    return res.status(500).json({ error: "Erreur lors de la récupération des textes" });
  }
}
