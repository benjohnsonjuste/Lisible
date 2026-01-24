import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { authorEmail } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(authorEmail).toString('base64').replace(/=/g, "") + ".json";
  const path = `data/users/${fileName}`;

  try {
    const { data } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path
    });

    const profile = JSON.parse(Buffer.from(data.content, "base64").toString());
    const newViews = (profile.totalViews || 0) + 1;

    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path,
      message: "Incrémentation vue (monétisation)",
      content: Buffer.from(JSON.stringify({ ...profile, totalViews: newViews }, null, 2)).toString("base64"),
      sha: data.sha
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
