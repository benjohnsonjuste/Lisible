import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const blob = await put(
      `texts/${Date.now()}.json`,
      JSON.stringify({ title, content, createdAt: new Date().toISOString() }),
      { access: "public" }
    );

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Publish error:", error);
    return res.status(500).json({ error: "Failed to publish text" });
  }
}
