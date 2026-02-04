// pages/api/works/update.js
export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { workId, updatedData, userEmail } = req.body;

  if (!workId || !updatedData || !userEmail) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const fileName = workId.endsWith(".json") ? workId : `${workId}.json`;
  const repoPath = `data/posts/${fileName}`;

  try {
    // 1. Récupérer le fichier actuel pour vérifier le propriétaire
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}?t=${Date.now()}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getFileRes.ok) {
      return res.status(404).json({ error: "Œuvre introuvable" });
    }

    const fileData = await getFileRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // 2. VÉRIFICATION DE SÉCURITÉ
    const authorEmailInFile = currentContent.authorEmail || currentContent.authorId;
    if (authorEmailInFile?.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: "Action interdite : vous n'êtes pas l'auteur." });
    }

    // 3. PRÉPARATION DES NOUVELLES DONNÉES
    // On fusionne l'ancien contenu avec les modifications pour ne rien perdre
    const finalContent = {
      ...currentContent,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    // 4. MISE À JOUR SUR GITHUB
    const updateRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Mise à jour sécurisée de : ${updatedData.title || workId}`,
          content: Buffer.from(JSON.stringify(finalContent, null, 2)).toString('base64'),
          sha: fileData.sha, // Requis pour la mise à jour
        }),
      }
    );

    if (updateRes.ok) {
      return res.status(200).json({ message: "Œuvre mise à jour avec succès" });
    } else {
      throw new Error("Échec de la mise à jour sur GitHub");
    }

  } catch (error) {
    console.error("Erreur Update Sécurité:", error);
    return res.status(500).json({ error: "Erreur lors de la modification" });
  }
}
