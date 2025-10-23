// lib/githubClient.js
// Utilisé uniquement côté serveur (API routes). N'expose pas GITHUB_TOKEN au client.

const GITHUB_API_BASE = "https://api.github.com";

export async function putFileToRepo({ owner, repo, path, contentBase64, message, branch, token }) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const payload = {
    message: message || `Add ${path}`,
    content: contentBase64,
    branch,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json && json.message ? json.message : `GitHub API error ${res.status}`;
    const err = new Error(msg);
    err.info = json;
    throw err;
  }
  return json;
}

export async function listFilesInRepoDir({ owner, repo, path, branch, token }) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token ? `token ${token}` : undefined,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const json = await res.text();
    throw new Error(`GitHub list error ${res.status}: ${json}`);
  }
  return res.json();
}

export async function getFileContent({ owner, repo, path, branch, token }) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: token ? `token ${token}` : undefined,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub get file error ${res.status}`);
  }
  return res.json(); // contains .content (base64) if file
}