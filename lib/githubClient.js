export async function saveFileToGitHub(path, content) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const getFile = await fetch(url, {
    headers: { Authorization: `token ${token}` },
  });

  const fileData = await getFile.json();

  const sha = fileData.sha;

  const body = {
    message: "update content",
    content: Buffer.from(content).toString("base64"),
    sha,
  };

  const update = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!update.ok) throw new Error("GitHub save failed");
}