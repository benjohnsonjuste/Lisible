import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { type, message, targetEmail, link } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner = "benjohnsonjuste";
  const repo = "Lisible";
  const path = "data/notifications.json";

  try {
    const { data: fileData } = await octokit.repos.getContent({ owner, repo, path });
    const notifications = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    const newNotif = {
      id: Date.now(),
      type,
      message,
      targetEmail,
      link,
      date: new Date().toISOString()
    };

    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path,
      message: `📢 Global Notif: ${type}`,
      content: Buffer.from(JSON.stringify([newNotif, ...notifications].slice(0, 50), null, 2)).toString("base64"),
      sha: fileData.sha
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
