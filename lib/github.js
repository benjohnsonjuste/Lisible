const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "benjohnsonjuste";
const REPO_NAME = "Lisible";

/**
 * Standardise l'ID de l'utilisateur (Base64 du mail nettoyé)
 */
export const getEmailId = (email) => {
  if (!email) return "";
  return Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
};

/**
 * Récupère le contenu d'un fichier sur GitHub
 */
export async function getFile(path) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
        },
        cache: "no-store", // Crucial pour Next.js 14+ pour obtenir les données fraîches
      }
    );

    if (res.status === 404) return null;
    
    const data = await res.json();
    
    if (!data.content) return null;

    // Décodage UTF-8 sécurisé pour éviter les problèmes d'accents
    const content = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    
    return {
      content,
      sha: data.sha,
    };
  } catch (error) {
    console.error(`Erreur getFile (${path}):`, error);
    return null;
  }
}

/**
 * Met à jour ou crée un fichier sur GitHub
 */
export async function updateFile(path, content, sha, message = "Update via Lisible API") {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
          sha: sha || undefined,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erreur lors de l'écriture GitHub");
    }

    return data;
  } catch (error) {
    console.error(`Erreur updateFile (${path}):`, error);
    throw error;
  }
}
