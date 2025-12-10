// /pages/api/publishText.js
import { commitFileToGithub } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, content, imageBase64, author } = req.body;

    if (!title || !content || !author) return res.status(400).json({ error: "Missing fields" });

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const data = {
      id,
      title,
      content,
      image: imageBase64 || null,
      author,
      date: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    const path = `data/texts/${id}.json`;
    await commitFileToGithub(path, data, `Publish text ${title}`);

    res.status(200).json({ message: "Published", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to publish" });
  }
}