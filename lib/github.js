// /lib/github.js
import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export const GITHUB_REPO = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
};

/**
 * Commit un fichier JSON dans GitHub
 * @param {string} path Chemin du fichier dans le repo (ex: "data/texts/123.json")
 * @param {object} content Objet JS à sauvegarder
 */
export async function commitTextToGithub(path, content) {
  try {
    // Vérifie si le fichier existe déjà
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner: GITHUB_REPO.owner,
        repo: GITHUB_REPO.repo,
        path,
      });
      sha = data.sha;
    } catch (err) {
      // Si le fichier n'existe pas, sha reste undefined
      sha = undefined;
    }

    const res = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.owner,
      repo: GITHUB_REPO.repo,
      path,
      message: "Ajout d’un texte depuis Lisible",
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      branch: "main",
      sha, // si undefined, GitHub crée un nouveau fichier
    });

    return res.data;
  } catch (error) {
    console.error("Erreur GitHub:", error);
    throw error;
  }
}