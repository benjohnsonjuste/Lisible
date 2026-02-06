export default async function handler(req, res) {
  const { id } = req.query; // L'ID du texte (le nom du fichier sans .json ou l'ID interne)

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // L'ID doit correspondre au nom du fichier sur GitHub (ex: 12345.json)
  const fileName = id.endsWith(".json") ? id : `${id}.json`;
  const repoPath = `data/posts/${fileName}`;

  try {
    // 1. Récupérer le "sha" du fichier (nécessaire pour supprimer sur GitHub)
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getFileRes.ok) {
      return res.status(404).json({ error: "Œuvre introuvable sur le serveur" });
    }

    const fileData = await getFileRes.json();
    const sha = fileData.sha;

    // 2. Supprimer le fichier sur GitHub
    const deleteRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Suppression de l'œuvre : ${id}`,
          sha: sha,
        }),
      }
    );

    if (deleteRes.ok) {
      return res.status(200).json({ message: "Œuvre supprimée avec succès" });
    } else {
      const errorData = await deleteRes.json();
      return res.status(500).json({ error: errorData.message || "Échec de la suppression" });
    }
  } catch (error) {
    console.error("Erreur suppression GitHub:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
}
