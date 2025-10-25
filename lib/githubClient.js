// lib/githubClient.js
const API_BASE = "https://api.github.com";

function getHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

export async function getFileContent({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) return null;
  return await res.json();
}

export async function listFilesInDir({ owner, repo, path, branch = "main", token }) {
  const url = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  if (!res.ok) return [];
  return await res.json();
}

// create or update file
export async function createOrUpdateFile({ owner, repo, path, content, commitMessage, branch = "main", token }) {
  if (!owner || !repo || !path || typeof content === "undefined" || !commitMessage || !token) {
    throw new Error("Missing parameters for GitHub file operation");
  }

  // check existing to get sha
  const getUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const getRes = await fetch(getUrl, { headers: getHeaders(token) });
  let sha = null;
  if (getRes.ok) {
    const json = await getRes.json();
    sha = json.sha;
  }

  const putUrl = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  };

  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create/update file ${path}`);
  }

  return await putRes.json();
}