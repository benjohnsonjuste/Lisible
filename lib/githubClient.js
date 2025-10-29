const API_BASE = "https://api.github.com";
const OWNER = "benjohnsonjuste";
const REPO = "Lisible";
const TOKEN = process.env.GITHUB_TOKEN;

function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

// -----------------------------
// Fonction générique pour créer ou mettre à jour un fichier
// -----------------------------
export async function createOrUpdateFile({ path, content, message }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;
  const getRes = await fetch(url, { headers: getHeaders() });
  const file = getRes.ok ? await getRes.json() : null;

  const res = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      sha: file?.sha,
      branch: "main",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur GitHub: ${text}`);
  }

  return await res.json();
}

// -----------------------------
// Fonction générique pour récupérer un fichier
// -----------------------------
export async function getFileContent({ path, branch = "main" }) {
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${branch}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Impossible de récupérer le fichier: ${text}`);
  }

  const data = await res.json();
  return Buffer.from(data.content, "base64").toString();
}

// -----------------------------
// Récupérer les infos d'un utilisateur
// -----------------------------
export async function getUserFromGithub(uid) {
  try {
    const content = await getFileContent({ path: `users/${uid}.json` });
    return JSON.parse(content);
  } catch (err) {
    console.error("getUserFromGithub:", err);
    return null;
  }
}

// -----------------------------
// Sauvegarder les infos d'un utilisateur
// -----------------------------
export async function saveUserToGithub(user) {
  try {
    return await createOrUpdateFile({
      path: `users/${user.uid}.json`,
      content: JSON.stringify(user, null, 2),
      message: `Mise à jour utilisateur ${user.uid}`,
    });
  } catch (err) {
    console.error("saveUserToGithub:", err);
    throw err;
  }
}

// -----------------------------
// Récupérer tous les textes d'un auteur
// -----------------------------
export async function getTextsFromGithub(uid) {
  try {
    const content = await getFileContent({ path: `texts/${uid}/index.json` });
    return JSON.parse(content);
  } catch (err) {
    console.error("getTextsFromGithub:", err);
    return [];
  }
}