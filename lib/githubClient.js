// lib/githubClient.js
const API_BASE = "https://api.github.com";

/**
 * Crée ou met à jour un fichier sur GitHub
 * @param {Object} params
 * @param {string} params.owner - Propriétaire du repo
 * @param {string} params.repo - Nom du repo
 * @param {string} params.path - Chemin du fichier dans le repo
 * @param {string} params.content - Contenu du fichier (JSON ou Base64 pour images)
 * @param {string} params.commitMessage - Message du commit
 * @param {string} [params.branch="main"] - Branche
 * @param {string} params.token - Token GitHub avec droits repo
 */
export async function createOrUpdateFile({
  owner,
  repo,
  path,
  content,
  commitMessage,
  branch = "main",
  token,
}) {
  if (!owner || !repo || !path || !content || !commitMessage || !token) {
    throw new Error("Missing parameters for GitHub file operation");
  }

  // Vérifier si le fichier existe déjà pour obtenir le SHA
  const urlGet = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;

  let sha = null;
  const getRes = await fetch(urlGet, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // Préparer le contenu : si image Base64, enlever le préfixe data:image/png;base64,
  let fileContent = content;
  if (content.startsWith("data:")) {
    const commaIndex = content.indexOf(",");
    fileContent = content.substring(commaIndex + 1);
  }

  // Créer ou mettre à jour le fichier
  const urlPut = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

  const body = {
    message: commitMessage,
    content: fileContent,
    branch,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(urlPut, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json();
    console.error("GitHub API error:", err);
    throw new Error(err.message || `Failed to create/update file at ${path}`);
  }

  return await putRes.json();
}

/**
 * Liste les fichiers dans un répertoire
 */
export async function listFilesInRepoDir({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return [];
  return await res.json();
}

/**
 * Récupère le contenu d’un fichier
 */
export async function getFileContent({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return null;
  return await res.json();
}