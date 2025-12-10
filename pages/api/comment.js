// /pages/api/comment.js
import { commitFileToGithub, octokit, GITHUB_REPO } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { textId, username, comment } = req.body;
  if (!textId || !username || !comment) return res.status(400).json({ error: "Missing fields" });

  try {
    const path = `data/texts/${textId}.json`;
    const { data } = await octokit.repos.getContent({
      owner: GITHUB_REPO.owner,
      repo: GITHUB_REPO.repo,
      path,
    });

    const textData = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));

    textData.comments.push({
      author: username,
      content: comment,
      date: new Date().toISOString(),
    });

    await commitFileToGithub(path, textData, `Add comment to ${textId}`);

    res.status(200).json({ comments: textData.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
}