const API_BASE = "https://api.github.com";
const OWNER = "benjohnsonjuste"; // ton nom d’utilisateur GitHub
const REPO = "Lisible";          // ton dépôt GitHub
const TOKEN = process.env.GITHUB_TOKEN; // clé perso stockée dans Vercel

// 🛠️ Crée les en-têtes d’authentification pour GitHub API
function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/**
 * 📄 Crée ou met à jour un fichier sur GitHub
 * @param {string} path - Chemin du fichier (ex: 'public/data/texts/123.json')
 * @param {string} content - Contenu brut du fichier (non encodé)
 * @param {string} message - Message du commit
 */
export async function createOrUpdateFile({ path, content, message }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;

  // Vérifie si le fichier existe déjà sur GitHub
  const getRes = await fetch(url, { headers: getHeaders() });
  const file = getRes.ok ? await getRes.json() : null;

  // Met à jour ou crée le fichier
  const res = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"), // encodage base64
      sha: file?.sha, // nécessaire si le fichier existe déjà
      branch: "main",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur GitHub: ${text}`);
  }

  return await res.json();
}

/**
 * 📥 Récupère le contenu brut d’un fichier depuis GitHub
 * @param {string} path - Chemin du fichier (ex: 'public/data/texts/index.json')
 * @param {string} branch - Branche du repo (par défaut "main")
 * @returns {Promise<string>} - Contenu du fichier (texte brut)
 */
export async function getFileContent({ path, branch = "main" }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Impossible de récupérer le fichier: ${text}`);
  }

  const data = await res.json();
  return Buffer.from(data.content, "base64").toString(); // décodage base64
}