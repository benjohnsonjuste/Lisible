// lib/githubClient.js

import { toBase64 } from "./base64";

const API_BASE = "https://api.github.com";

function getHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

/**
 * Récupère le contenu d’un fichier du repo.
 */
export async function getFileContent({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Liste les fichiers d’un dossier.
 */
export async function listFilesInDir({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) return [];
  return await res.json();
}

/**
 * Crée ou met à jour un fichier dans le repo GitHub.
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

  // Vérifie si le fichier existe déjà pour obtenir le sha
  const getUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const getRes = await fetch(getUrl, { headers: getHeaders(token) });

  let sha = null;
  if (getRes.ok) {
    const json = await getRes.json();
    sha = json.sha;
  }

  // Prépare le body du commit
  const putUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: commitMessage,
    content: toBase64(content),
    branch,
    ...(sha ? { sha } : {}),
  };

  // Envoie du commit
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    console.error("GitHub commit error:", errText);
    throw new Error(`Failed to create/update file ${path}`);
  }

  return await putRes.json();
}