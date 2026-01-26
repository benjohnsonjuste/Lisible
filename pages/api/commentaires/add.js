import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  const comment = JSON.parse(req.body);
  const { data: file } = await octokit.repos.getContent({ owner: "benjohnsonjuste", repo: "Lisible", path: "data/commentaires.json" });
  const content = JSON.parse(Buffer.from(file.content, "base64").toString());
  
  content.push({ id: Date.now(), ...comment });
  
  await octokit.repos.createOrUpdateFileContents({
    owner: "benjohnsonjuste", repo: "Lisible", path: "data/commentaires.json",
    message: "Nouveau commentaire", content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"), sha: file.sha
  });
  res.status(200).json({ ok: true });
}
