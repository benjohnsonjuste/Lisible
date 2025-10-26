const API_BASE = "https://api.github.com";
const OWNER = "benjohnsonjuste"; // ton username GitHub
const REPO = "Lisible";          // ton repo GitHub
const TOKEN = process.env.GITHUB_TOKEN; // clé perso dans Vercel

function getHeaders() {
  return {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

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