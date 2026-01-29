import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { name, email, password, joinedAt } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const fileName = Buffer.from(email.toLowerCase()).toString('base64').replace(/=/g, "") + ".json";

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: `data/users/${fileName}`,
      message: `Inscription : ${name}`,
      content: Buffer.from(JSON.stringify({ 
        name, 
        email: email.toLowerCase(), 
        password, // Stockage du mot de passe
        joinedAt,
        subscribers: [],
        totalViews: 0
      }, null, 2)).toString("base64"),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
