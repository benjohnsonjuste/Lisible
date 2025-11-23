// /lib/githubClient.js

const API_BASE = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER || "benjohnsonjuste";
const REPO = process.env.GITHUB_REPO || "Lisible";
const TOKEN = process.env.GITHUB_TOKEN;

// Warn si le token est absent (évite crash build Vercel)
if (!TOKEN) {
  console.warn("⚠️ GITHUB_TOKEN non défini. Les appels GitHub nécessiteront un token.");
}

/**
 * Headers GitHub
 */
function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/**
 * 📌 Crée ou met à jour un fichier dans GitHub
 */
export async function createOrUpdateFile({ path, content, message }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;

  // Vérifie si le fichier existe (GET)
  const getRes = await fetch(url, { headers: getHeaders() });
  const existing = getRes.ok ? await getRes.json() : null;

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: "main",
  };

  if (existing?.sha) body.sha = existing.sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${await res.text()}`);
  }

  return await res.json();
}

/**
 * 📌 Récupère le contenu brut d’un fichier du repo GitHub
 */
export async function getFileContent({ path, branch = "main" }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${branch}`;

  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    throw new Error(`Impossible de récupérer le fichier: ${await res.text()}`);
  }

  const data = await res.json();
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/**
 * ✅ 📌 Récupère un utilisateur GitHub par son username
 * Requise par: /pages/api/get-user.js
 */
export async function getUserFromGithub(username) {
  const url = `${API_BASE}/users/${encodeURIComponent(username)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    console.error("GitHub getUserFromGithub error:", res.status);
    return null;
  }

  const data = await res.json();

  return {
    id: data.id,
    username: data.login,
    name: data.name,
    avatar: data.avatar_url,
    bio: data.bio,
    url: data.html_url,
    followers: data.followers,
    following: data.following,
  };
}