// /lib/githubClient.js
const API = "https://api.github.com";

function envOrThrow(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const GITHUB = {
  token: process.env.GITHUB_TOKEN || null,
  owner: process.env.GITHUB_REPO_OWNER || null,
  repo: process.env.GITHUB_REPO_NAME || null,
  branch: process.env.GITHUB_REPO_BRANCH || "main",
};

function authHeaders() {
  if (!GITHUB.token) throw new Error("GITHUB_TOKEN not configured");
  return {
    Authorization: `Bearer ${GITHUB.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

export async function getFile(path) {
  const url = `${API}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${encodeURIComponent(path)}?ref=${GITHUB.branch}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub getFile failed: ${res.status} ${txt}`);
  }
  return res.json(); // contains content (base64), sha, etc.
}

export async function createOrUpdateFile(path, contentBase64, message, sha) {
  const url = `${API}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: contentBase64,
    branch: GITHUB.branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub createOrUpdateFile failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}