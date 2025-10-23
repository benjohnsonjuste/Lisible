import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
  try {
    const filePath = `data/texts/${id}.md`;
    const file = await getFileContent({ path: filePath, owner: process.env.GITHUB_OWNER, repo: process.env.GITHUB_REPO, branch: process.env.GITHUB_BRANCH, token: process.env.GITHUB_TOKEN });

    let content = Buffer.from(file.content, "base64").toString("utf8");
    const likesMatch = content.match(/likes:\s*(\d+)/);
    const likes = likesMatch ? Number(likesMatch[1]) + 1 : 1;

    // replace or add likes
    if (likesMatch) {
      content = content.replace(/likes:\s*\d+/, `likes: ${likes}`);
    } else {
      content = content.replace(/^---\s*([\s\S]*?)---/, `---$1\nlikes: ${likes}\n---`);
    }

    await createOrUpdateFile({
      path: filePath,
      content,
      commitMessage: `Like ${id}`,
      branch: process.env.GITHUB_BRANCH || "main",
    });

    res.status(200).json({ success: true, likes });
  } catch (err) {
    console.error("like error", err);
    res.status(500).json({ error: err.message });
  }
      }
