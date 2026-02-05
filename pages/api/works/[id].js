// pages/api/works/[id].js
export default async function handler(req, res) {
  const { id } = req.query; 
  
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Récupération sécurisée de l'email via les headers
  const userEmail = req.headers["x-user-email"]; 

  if (!userEmail) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const fileName = id.endsWith(".json") ? id : `${id}.json`;
  const textPath = `data/texts/${fileName}`;
  const indexPath = `data/publications/index.json`;

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    // 1. RÉCUPÉRER LE FICHIER COMPLET POUR VÉRIFIER L'IDENTITÉ
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}?t=${Date.now()}`,
      { headers }
    );

    if (!getFileRes.ok) {
      return res.status(404).json({ error: "Œuvre introuvable" });
    }

    const fileData = await getFileRes.json();
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));

    // 2. VÉRIFICATION DE SÉCURITÉ
    const authorEmailInFile = content.authorEmail || content.authorId; 
    if (authorEmailInFile?.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: "Action interdite : vous n'êtes pas l'auteur." });
    }

    // 3. SUPPRESSION DU FICHIER COMPLET (/data/texts/)
    const deleteFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Delete text: ${id} by author ${userEmail}`,
          sha: fileData.sha,
        }),
      }
    );

    if (!deleteFileRes.ok) throw new Error("Échec de la suppression du fichier source");

    // 4. NETTOYAGE DE L'INDEX GLOBAL (/data/publications/index.json)
    const getIndexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}?t=${Date.now()}`,
      { headers }
    );

    if (getIndexRes.ok) {
      const indexFileData = await getIndexRes.json();
      let indexArray = JSON.parse(Buffer.from(indexFileData.content, 'base64').toString('utf-8'));

      // Filtrer pour retirer l'œuvre de l'index
      const newIndex = indexArray.filter(item => item.id !== id && item.id !== id.replace('.json', ''));

      await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Remove from index: ${id}`,
            content: Buffer.from(JSON.stringify(newIndex, null, 2)).toString('base64'),
            sha: indexFileData.sha,
          }),
        }
      );
    }

    return res.status(200).json({ message: "Suppression synchronisée réussie" });

  } catch (error) {
    console.error("Erreur procédure suppression:", error);
    return res.status(500).json({ error: "Erreur lors de la suppression sur le serveur" });
  }
}
