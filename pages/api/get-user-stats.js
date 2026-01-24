import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const { email } = req.query;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const fileName = Buffer.from(email).toString('base64').replace(/=/g, "") + ".json";

  try {
    const { data } = await octokit.repos.getContent({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: `data/users/${fileName}`
    });

    const user = JSON.parse(Buffer.from(data.content, "base64").toString());
    
    // On calcule les stats réelles
    // Si vous stockez les textes dans user.texts[], on fait la somme des vues
    const totalViews = user.texts?.reduce((acc, text) => acc + (text.views || 0), 0) || 0;
    const totalTexts = user.texts?.length || 0;

    res.status(200).json({ totalViews, totalTexts });
  } catch (error) {
    res.status(200).json({ totalViews: 0, totalTexts: 0 });
  }
}
