import { db } from "@/lib/firebaseAdmin";
import { octokit, GITHUB_REPO } from "@/lib/github";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, content } = req.body;
    const id = randomUUID();

    const textData = {
      id,
      title: title || "",
      content: content || "",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 🔹 1. Save to Firestore
    await db.collection("texts").doc(id).set(textData);

    // 🔹 2. Save to GitHub as Markdown
    const markdown = `# ${textData.title}\n\n${textData.content}`;

    await octokit.repos.createOrUpdateFileContents({
      ...GITHUB_REPO,
      path: `texts/${id}.md`,
      message: `Add text ${id}`,
      content: Buffer.from(markdown).toString("base64")
    });

    return res.status(200).json({ success: true, id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}