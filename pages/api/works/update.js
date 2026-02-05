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
  const textPath = `data/texts/${fileName}`;
  const indexPath = `data/publications/index.json`;

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // 1. RÉCUPÉRER LE FICHIER COMPLET POUR VÉRIFIER LE PROPRIÉTAIRE
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}?t=${Date.now()}`,
      { headers }
    );

    if (!getFileRes.ok) {
      return res.status(404).json({ error: "Œuvre introuvable dans la base de données" });
    }

    const fileData = await getFileRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));

    // 2. VÉRIFICATION DE SÉCURITÉ
    const authorEmailInFile = currentContent.authorEmail || currentContent.authorId;
    if (authorEmailInFile?.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: "Action interdite : vous n'êtes pas l'auteur." });
    }

    // 3. PRÉPARATION DU NOUVEAU CONTENU COMPLET
    const finalContent = {
      ...currentContent,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    // 4. MISE À JOUR DU FICHIER COMPLET DANS /data/texts/
    const updateFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Update text: ${finalContent.title}`,
          content: Buffer.from(JSON.stringify(finalContent, null, 2)).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );

    if (!updateFileRes.ok) throw new Error("Échec de la mise à jour du texte complet");

    // 5. MISE À JOUR DE L'INDEX GLOBAL (/data/publications/index.json)
    const getIndexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}?t=${Date.now()}`,
      { headers }
    );

    if (getIndexRes.ok) {
      const indexFileData = await getIndexRes.json();
      let indexArray = JSON.parse(Buffer.from(indexFileData.content, 'base64').toString('utf-8'));

      // On met à jour l'entrée correspondante dans l'index
      indexArray = indexArray.map(item => {
        if (item.id === workId) {
          return {
            ...item,
            title: updatedData.title || item.title,
            genre: updatedData.category || updatedData.genre || item.genre,
            // On ne stocke qu'un extrait dans l'index pour la performance
            content: updatedData.content ? updatedData.content.substring(0, 300) : item.content,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });

      await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `Update index for: ${workId}`,
            content: Buffer.from(JSON.stringify(indexArray, null, 2)).toString('base64'),
            sha: indexFileData.sha,
          }),
        }
      );
    }

    return res.status(200).json({ message: "Œuvre et index mis à jour avec succès" });

  } catch (error) {
    console.error("Erreur API Update:", error);
    return res.status(500).json({ error: "Erreur lors de la modification synchronisée" });
  }
}
