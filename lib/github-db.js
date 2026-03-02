const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Ton Token dans Vercel Env
const GITHUB_REPO = process.env.GITHUB_REPO;   // Format: "pseudo/nom-du-repo"
const GITHUB_BRANCH = "main";

/**
 * Récupère le contenu d'un fichier JSON sur GitHub
 */
export async function getGithubFile(path) {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: 'no-store' // Important pour avoir les données fraîches
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lecture GitHub (${path}):`, error);
    return null;
  }
}

/**
 * Sauvegarde des données dans un fichier JSON sur GitHub
 */
export async function saveGithubFile(path, content, message = "Database Update") {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
    
    // 1. Récupérer le SHA du fichier existant (obligatoire pour update)
    const fileData = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    }).then(res => res.json());

    const sha = fileData.sha;

    // 2. Envoyer la mise à jour
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
        sha,
        branch: GITHUB_BRANCH,
      }),
    });

    return await res.json();
  } catch (error) {
    console.error(`Erreur écriture GitHub (${path}):`, error);
    return { error: true };
  }
}
