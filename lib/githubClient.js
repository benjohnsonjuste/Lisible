// /lib/githubClient.js
const API_BASE = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER || "benjohnsonjuste";
const REPO = process.env.GITHUB_REPO || "Lisible";
const TOKEN = process.env.GITHUB_TOKEN; // Défini dans Vercel env vars

if (!TOKEN) {
  // Ne throw pas ici (build serveur), mais log pour debug
  console.warn("⚠️ GITHUB_TOKEN non défini. Les appels GitHub échoueront jusqu'à ce que tu le configures.");
}

function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/**
 * Crée ou met à jour un fichier dans le repo GitHub
 * @param {{path:string, content:string, message:string}} param0
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
    const text = await res.text();
    const err = new Error(`GitHub API error: ${text}`);
    err.status = res.status;
    throw err;
  }

  return await res.json();
}

/**
 * Récupère le contenu brut d’un fichier depuis GitHub
 * @param {{path:string, branch?:string}} param0
 */
export async function getFileContent({ path, branch = "main" }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Impossible de récupérer le fichier: ${text}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return Buffer.from(data.content, "base64").toString("utf-8");
}