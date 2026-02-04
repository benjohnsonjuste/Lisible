// pages/api/works/[id].js
export default async function handler(req, res) {
  const { id } = req.query; // ID de l'œuvre
  
  // 1. Vérification de la méthode
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // 2. Récupération de l'email de l'utilisateur depuis les headers (envoyé par le front)
  // ou via un body. Dans votre dashboard, vous pouvez l'envoyer dans le body.
  const userEmail = req.headers["x-user-email"]; 

  if (!userEmail) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const fileName = id.endsWith(".json") ? id : `${id}.json`;
  const repoPath = `data/posts/${fileName}`;

  try {
    // 3. Récupérer le fichier pour vérifier l'identité de l'auteur
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
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // 4. VÉRIFICATION DE SÉCURITÉ
    // On compare l'email du demandeur avec l'email stocké dans l'œuvre
    const authorEmailInFile = content.authorEmail || content.authorId; 
    
    if (authorEmailInFile?.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer cette œuvre" });
    }

    // 5. SUPPRESSION (si la vérification réussit)
    const deleteRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${repoPath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Suppression sécurisée par l'auteur : ${userEmail}`,
          sha: fileData.sha,
        }),
      }
    );

    if (deleteRes.ok) {
      return res.status(200).json({ message: "Suppression réussie" });
    } else {
      throw new Error("Échec de la suppression finale");
    }

  } catch (error) {
    console.error("Erreur Sécurité/GitHub:", error);
    return res.status(500).json({ error: "Erreur lors de la procédure de suppression" });
  }
}
