import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export const GITHUB_REPO = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
};

export async function commitFileToGithub(path, data, message = "Commit") {
  const content = Buffer.from(
    typeof data === "string" ? data : JSON.stringify(data, null, 2)
  ).toString("base64");

  await octokit.repos.createOrUpdateFileContents({
    owner: GITHUB_REPO.owner,
    repo: GITHUB_REPO.repo,
    path,
    message,
    content,
  });
}