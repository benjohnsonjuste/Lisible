// /lib/github.js
import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export const GITHUB_REPO = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
};

// Commit un JSON sur GitHub
export const commitFileToGithub = async (path, contentObj, message) => {
  const content = Buffer.from(JSON.stringify(contentObj, null, 2)).toString("base64");

  try {
    // Vérifier si le fichier existe pour update
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_REPO.owner,
      repo: GITHUB_REPO.repo,
      path,
    });

    // Si existe → update
    return await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.owner,
      repo: GITHUB_REPO.repo,
      path,
      message,
      content,
      sha: data.sha,
    });
  } catch (err) {
    if (err.status === 404) {
      // Si n'existe pas → création
      return await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_REPO.owner,
        repo: GITHUB_REPO.repo,
        path,
        message,
        content,
      });
    }
    throw err;
  }
};