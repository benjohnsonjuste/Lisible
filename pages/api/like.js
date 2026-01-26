import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { id } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/textes.json",
    });

    const content = JSON.parse(Buffer.from(fileData.content, "base64").toString());
    const updatedContent = content.map((t) => {
      if (String(t.id) === String(id)) {
        return { ...t, likes: (Number(t.likes) || 0) + 1 };
      }
      return t;
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "data/textes.json",
      message: "❤️ Nouveau like",
      content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64"),
      sha: fileData.sha,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
