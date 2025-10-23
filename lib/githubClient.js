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

  // Vérifier si le fichier existe déjà
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

  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // Créer ou mettre à jour
  const urlPut = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}`;

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
    throw new Error(err.message || `Failed to create/update file at ${path}`);
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