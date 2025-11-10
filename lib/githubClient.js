// lib/githubClient.js
const API_BASE = "https://api.github.com";
const OWNER = "benjohnsonjuste"; // ton nom d’utilisateur GitHub
const REPO = "Lisible";          // ton dépôt GitHub
const TOKEN = process.env.GITHUB_TOKEN; // clé perso stockée dans Vercel

// 🛠️ En-têtes d’authentification GitHub
function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/**
 * 📄 Crée ou met à jour un fichier sur GitHub
 * @param {string} path - ex: 'public/data/texts/123.json'
 * @param {string} content - contenu brut (non encodé)
 * @param {string} message - message du commit
 */
export async function createOrUpdateFile({ path, content, message }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;

  // Vérifie si le fichier existe déjà
  const getRes = await fetch(url, { headers: getHeaders() });
  const file = getRes.ok ? await getRes.json() : null;

  const res = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      sha: file?.sha,
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
 * 📥 Récupère le contenu d’un fichier GitHub
 * @param {string} path - ex: 'public/data/texts/index.json'
 * @param {string} branch - par défaut "main"
 */
export async function getFileContent({ path, branch = "main" }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Impossible de récupérer le fichier: ${text}`);
  }

  const data = await res.json();
  return Buffer.from(data.content, "base64").toString();
}

/**
 * 🧍 Récupère les données d’un utilisateur stocké sur GitHub
 */
export async function getUserFromGithub(uid) {
  const path = `public/data/users/${uid}.json`;
  try {
    const json = await getFileContent({ path });
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * 💾 Sauvegarde ou met à jour un utilisateur sur GitHub
 */
export async function saveUserToGithub(user) {
  const path = `public/data/users/${user.uid}.json`;
  const content = JSON.stringify(user, null, 2);
  return await createOrUpdateFile({
    path,
    content,
    message: `Mise à jour de l’utilisateur ${user.uid}`,
  });
}

/**
 * 🗂️ Sauvegarde un fichier générique sur GitHub
 * (permet d’enregistrer n’importe quel contenu : texte, commentaires, abonnés, etc.)
 * @param {string} path - chemin du fichier (ex: 'public/data/texts/123.json')
 * @param {object|string} data - contenu à sauvegarder
 * @param {string} message - message du commit
 */
export async function saveFileToGitHub(path, data, message = "Mise à jour automatique") {
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return await createOrUpdateFile({ path, content, message });
}