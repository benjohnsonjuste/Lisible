import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/marketing/partners.json";

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const content = JSON.parse(Buffer.from(data.content, "base64").toString());
    res.status(200).json(content);
  } catch (error) {
    res.status(200).json({}); // Si le fichier n'existe pas encore
  }
}
