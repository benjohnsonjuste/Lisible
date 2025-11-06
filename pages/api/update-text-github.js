// /pages/api/update-text-github.js
import { createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { id, updatedData } = req.body;
  if (!id || !updatedData)
    return res.status(400).json({ error: "ID et données requises" });

  try {
    const path = `data/texts/${id}.json`;
    await createOrUpdateFile({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      content: JSON.stringify(updatedData, null, 2),
      token: process.env.GITHUB_TOKEN,
      message: `update text ${id}`,
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}