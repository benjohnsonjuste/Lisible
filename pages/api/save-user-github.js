import { Octokit } from "octokit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      uid,
      authorName,
      authorEmail,
      firstName,
      lastName,
      penName,
      birthday,
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      subscribers,
      profilePic,
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID manquant" });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${uid}.json`;
    const contentData = {
      uid,
      authorName,
      authorEmail,
      firstName,
      lastName,
      penName,
      birthday,
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      subscribers: subscribers || [],
      profilePic: profilePic || "/avatar.png",
    };

    // Vérifier si le fichier existe pour récupérer le sha
    let sha = undefined;
    try {
      const { data: existingFile } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path,
        }
      );
      sha = existingFile.sha;
    } catch (err) {
      // Si le fichier n'existe pas, sha reste undefined → création
    }

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `Sauvegarde du profil utilisateur ${uid}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString(
        "base64"
      ),
      sha, // undefined si création
    });

    return res.status(200).json({ success: true, data: contentData });
  } catch (err) {
    console.error("Erreur GitHub API:", err);
    return res
      .status(500)
      .json({ error: "Impossible de sauvegarder sur GitHub" });
  }
}