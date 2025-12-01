import { Octokit } from "@octokit/rest";

export const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export const GITHUB_REPO = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
};