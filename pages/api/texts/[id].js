import { db } from "@/lib/firebaseAdmin";
import { octokit, GITHUB_REPO } from "@/lib/github";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Check Firestore first
  const doc = await db.collection("texts").doc(id).get();

  if (doc.exists) {
    return res.status(200).json(doc.data());
  }

  // 2. Check GitHub
  try {
    const file = await octokit.repos.getContent({
      ...GITHUB_REPO,
      path: `texts/${id}.md`,
    });

    const mdBase64 = file.data.content;
    const md = Buffer.from(mdBase64, "base64").toString("utf-8");

    const [titleLine, ...contentLines] = md.split("\n");
    const title = titleLine.replace("# ", "");
    const content = contentLines.join("\n");

    return res.status(200).json({ id, title, content, from: "github" });
  } catch (e) {
    return res.status(404).json({ error: "Text not found" });
  }
}