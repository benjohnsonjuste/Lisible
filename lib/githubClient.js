import fetch from "node-fetch";

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

const API_URL = `https://api.github.com/repos/${owner}/${repo}/contents`;

// 🔹 Lire un fichier GitHub (JSON)
export async function getFileContent(path) {
  const url = `${API_URL}/${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `token ${token}` },
  });

  if (res.status === 404) return null; // fichier n'existe pas

  const json = await res.json();
  const content = Buffer.from(json.content, "base64").toString("utf8");
  const sha = json.sha;

  return { content, sha };
}

// 🔹 Créer ou mettre à jour un fichier JSON
export async function createOrUpdateFile(path, data) {
  const existing = await getFileContent(path);

  const body = {
    message: "update file",
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
    sha: existing?.sha,
  };

  const res = await fetch(`${API_URL}/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error("GitHub update failed: " + msg);
  }

  return await res.json();
}

// 🔹 Supprimer un fichier
export async function deleteFile(path) {
  const existing = await getFileContent(path);
  if (!existing) return null;

  const res = await fetch(`${API_URL}/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "delete file",
      sha: existing.sha,
    }),
  });

  if (!res.ok) throw new Error("GitHub delete failed");
  return true;
}

// 🔹 Utilisé par /api/github-save
export async function saveFileToGitHub(path, content) {
  const existing = await getFileContent(path);

  const body = {
    message: "update content",
    content: Buffer.from(content).toString("base64"),
    sha: existing?.sha,
  };

  const res = await fetch(`${API_URL}/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error("GitHub save failed: " + msg);
  }

  return await res.json();
}

// 🔹 Récupérer un utilisateur depuis GitHub
export async function getUserFromGithub(userId) {
  const file = await getFileContent(`users/${userId}.json`);
  if (!file) return null;
  return JSON.parse(file.content);
}