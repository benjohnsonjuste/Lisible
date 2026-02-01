import { Buffer } from "buffer";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "benjohnsonjuste";
const REPO = "Lisible";

export async function getFile(path) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    content: JSON.parse(Buffer.from(data.content, "base64").toString("utf-8")),
    sha: data.sha
  };
}

export async function updateFile(path, content, sha, message = "Update") {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { 
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
      sha
    }),
  });
  return res.ok;
}
