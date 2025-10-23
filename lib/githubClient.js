import fetch from "node-fetch";

/**
 * Crée ou met à jour un fichier dans un repo GitHub via l'API REST
 * @param {Object} params
 * @param {string} params.owner - Propriétaire du repo
 * @param {string} params.repo - Nom du repo
 * @param {string} params.path - Chemin du fichier dans le repo
 * @param {string} params.content - Contenu du fichier (texte)
 * @param {string} params.commitMessage - Message du commit
 * @param {string} [params.branch] - Branche du repo (par défaut main)
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

  // 1️⃣ Vérifier si le fichier existe déjà
  const urlGet = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}?ref=${branch}`;

  let sha = null;
  const getRes = await fetch(urlGet, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (getRes.status === 200) {
    const data = await getRes.json();
    sha = data.sha; // pour mise à jour
  }

  // 2️⃣ Créer ou mettre à jour
  const urlPut = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}`;

  const body = {
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
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
    throw new Error(
      err.message || `Failed to create/update file at ${path}`
    );
  }

  return await putRes.json();
}

/**
 * Liste les fichiers dans un répertoire d'un repo GitHub
 */
export async function listFilesInRepoDir({ owner, repo, path, branch = "main", token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}?ref=${branch}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) return [];
  return await res.json();
}

/**
 * Récupère le contenu d’un fichier du repo
 */
export async function getFileContent({ owner, repo, path, branch = "main", token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}?ref=${branch}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) return null;
  return await res.json();
}