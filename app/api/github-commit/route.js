// pages/api/github-commit.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // 🔥 IMPORTANT → variable réellement utilisée sur Vercel
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const repoOwner = process.env.GITHUB_OWNER;
  const repoName = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const filePath = req.body.filePath || "data/events.json";

  if (!token || !repoOwner || !repoName) {
    return res.status(500).json({
      error: "Variables d'environnement GitHub manquantes.",
      missing: {
        token: !!token,
        owner: !!repoOwner,
        repo: !!repoName,
      },
    });
  }

  const payload = req.body.data;
  const apiURL = "https://api.github.com";

  // 1️⃣ Récupérer ancien fichier (pour obtenir le SHA)
  let sha = null;
  let existingData = [];

  const getURL = `${apiURL}/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;

  const getRes = await fetch(getURL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (getRes.ok) {
    const file = await getRes.json();
    sha = file.sha;

    const decoded = Buffer.from(file.content, "base64").toString("utf8");

    try {
      existingData = JSON.parse(decoded);
    } catch (e) {
      existingData = [];
    }
  }

  // 2️⃣ Ajouter la nouvelle entrée
  existingData.push({
    ...payload,
    createdAt: new Date().toISOString(),
  });

  // 3️⃣ Encoder le nouveau contenu
  const newContent = Buffer.from(
    JSON.stringify(existingData, null, 2),
    "utf8"
  ).toString("base64");

  // 4️⃣ Commit vers GitHub
  const putRes = await fetch(
    `${apiURL}/repos/${repoOwner}/${repoName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Update ${filePath}`,
        content: newContent,
        sha: sha || undefined,
        branch,
      }),
    }
  );

  const putJson = await putRes.json();

  if (!putRes.ok) {
    return res.status(500).json({ error: putJson });
  }

  return res.status(200).json({
    ok: true,
    file: filePath,
    commit: putJson.commit,
  });
}