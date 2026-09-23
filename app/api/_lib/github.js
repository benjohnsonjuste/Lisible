// Couche d'accès aux données : fichiers JSON versionnés dans le repo GitHub.
// Recopie fidèle de la logique de app/api/github-db/route.js (ne pas importer depuis route.js).

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN,
};

function assertToken() {
  if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN is not defined");
}

export const getSafePath = (email) => {
  if (!email) return null;
  const safeEmail = email.toLowerCase().trim().replace(/[@.]/g, "_");
  return `data/users/${safeEmail}.json`;
};

// Lit un fichier JSON du repo. Retourne {content, sha} | {content, isDir:true} | null.
export async function getFile(path) {
  assertToken();
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Lisible-App",
        },
        cache: "no-store",
      }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return { content: data, isDir: true };
    if (!data.content) return null;
    const b64 = data.content.replace(/\s/g, "");
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decodedContent = new TextDecoder().decode(bytes);
    return { content: JSON.parse(decodedContent), sha: data.sha };
  } catch (err) {
    console.error(`Fetch error [${path}]:`, err.message);
    return null;
  }
}

// Écrit un fichier JSON. Retourne {ok, status} (le status permet de détecter les conflits 409).
export async function updateFile(path, content, sha, message) {
  assertToken();
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  const encodedContent = btoa(binString);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          "Content-Type": "application/json",
          "User-Agent": "Lisible-App",
        },
        body: JSON.stringify({
          message: `[DATA] ${message} [skip ci]`,
          content: encodedContent,
          sha: sha || undefined,
        }),
      }
    );
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error(`Update error [${path}]:`, err.message);
    return { ok: false, status: 0 };
  }
}

// Supprime un fichier du repo. Retourne {ok, status}.
export async function deleteFile(path, sha) {
  assertToken();
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          "Content-Type": "application/json",
          "User-Agent": "Lisible-App",
        },
        body: JSON.stringify({ message: `[DATA] Suppression: ${path} [skip ci]`, sha }),
      }
    );
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error(`Delete error [${path}]:`, err.message);
    return { ok: false, status: 0 };
  }
}

// Lit un JSON ou retourne la valeur de repli si le fichier n'existe pas.
export async function readJsonOr(path, fallback) {
  const file = await getFile(path);
  if (!file || file.isDir || file.content === undefined || file.content === null) {
    return { content: fallback, sha: null };
  }
  return { content: file.content, sha: file.sha };
}
