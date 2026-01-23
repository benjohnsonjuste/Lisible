// pages/api/update-text.js

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { id, type, payload } = req.body; // type = 'like' ou 'comment'
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "benjohnsonjuste";
  const REPO_NAME = "Lisible";
  const FILE_PATH = `data/publications/${id}.json`;

  try {
    // 1. Récupérer le fichier actuel et son SHA
    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    if (!getRes.ok) throw new Error("Fichier introuvable sur GitHub");
    const fileData = await getRes.json();
    const currentText = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // 2. Modifier les données selon l'action
    if (type === 'like') {
      currentText.likesCount = (currentText.likesCount || 0) + 1;
    } else if (type === 'comment') {
      if (!currentText.comments) currentText.comments = [];
      currentText.comments.push(payload);
    }

    // 3. Renvoyer le fichier mis à jour vers GitHub
    const updatedContent = Buffer.from(JSON.stringify(currentText, null, 2)).toString('base64');
    
    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Mise à jour interaction : ${type} sur ${id}`,
        content: updatedContent,
        sha: fileData.sha // Obligatoire pour modifier un fichier existant
      }),
    });

    if (!putRes.ok) throw new Error("Échec de la mise à jour GitHub");

    return res.status(200).json(currentText);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
