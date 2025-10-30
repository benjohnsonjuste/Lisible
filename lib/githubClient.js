const API_BASE = "https://api.github.com";
const OWNER = "benjohnsonjuste"; // ton compte GitHub
const REPO = "Lisible";
const TOKEN = process.env.GITHUB_TOKEN;

function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

// 🔹 Récupère un auteur depuis GitHub
export async function getUserFromGithub(uid) {
  const path = `data/users/${uid}.json`;
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) return null;
  const data = await res.json();
  return JSON.parse(Buffer.from(data.content, "base64").toString());
}

// 🔹 Sauvegarde les données d’un auteur sur GitHub
export async function saveUserToGithub(user) {
  const path = `data/users/${user.uid}.json`;
  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${path}`;

  // Vérifie si le fichier existe
  const getRes = await fetch(url, { headers: getHeaders() });
  const file = getRes.ok ? await getRes.json() : null;

  const res = await fetch(url, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      message: `Mise à jour profil auteur ${user.uid}`,
      content: Buffer.from(JSON.stringify(user, null, 2)).toString("base64"),
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