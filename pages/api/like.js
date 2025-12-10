// /pages/api/like.js
import { commitFileToGithub, octokit, GITHUB_REPO } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { textId, username } = req.body;
  if (!textId || !username) return res.status(400).json({ error: "Missing fields" });

  try {
    const path = `data/texts/${textId}.json`;
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_REPO.owner,
      repo: GITHUB_REPO.repo,
      path,
    });

    const textData = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));

    if (!textData.likes.includes(username)) textData.likes.push(username);

    await commitFileToGithub(path, textData, `Like text ${textId}`);

    res.status(200).json({ likes: textData.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to like" });
  }
}