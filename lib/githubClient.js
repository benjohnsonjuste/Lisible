const API_BASE = "https://api.github.com";

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

  const urlPut = `${API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: commitMessage,
    content: Buffer.from(content, "utf8").toString("base64"),
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