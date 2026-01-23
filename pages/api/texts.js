export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { authorName, title, content, imageBase64 } = req.body;
  
  // CONFIGURATION GITHUB
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // À ajouter dans les variables Vercel
  const REPO_OWNER = "benjohnsonjuste";
  const REPO_NAME = "Lisible";
  const FILE_PATH = `data/publications/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.json`;

  const contentEncoded = Buffer.from(JSON.stringify({
    authorName,
    title,
    content,
    imageBase64,
    date: new Date().toISOString()
  }, null, 2)).toString('base64');

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Nouveau texte : ${title}`,
        content: contentEncoded,
      }),
    });

    if (!response.ok) throw new Error("Erreur GitHub API");

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
