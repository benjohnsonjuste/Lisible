import { Octokit } from "@octokit/rest";
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  const { id } = JSON.parse(req.body);
  const { data: file } = await octokit.repos.getContent({ owner: "benjohnsonjuste", repo: "Lisible", path: "data/textes.json" });
  const content = JSON.parse(Buffer.from(file.content, "base64").toString());
  
  const updated = content.map(t => String(t.id) === String(id) ? { ...t, views: (t.views || 0) + 1 } : t);
  
  await octokit.repos.createOrUpdateFileContents({
    owner: "benjohnsonjuste", repo: "Lisible", path: "data/textes.json",
    message: "Incrément vue", content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"), sha: file.sha
  });
  res.status(200).json({ ok: true });
}
