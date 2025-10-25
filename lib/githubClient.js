import { Octokit } from "@octokit/rest";

if (!process.env.GITHUB_TOKEN) {
  throw new Error("❌ Le token GitHub (GITHUB_TOKEN) est manquant dans ton .env.local");
}

/**
 * Client GitHub réutilisable
 * Permet de lire et modifier les fichiers JSON (textes, commentaires, etc.)
 * directement dans le dépôt GitHub Lisible.
 */
export const githubClient = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
