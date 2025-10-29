import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const {
      uid,
      firstName,
      lastName,
      penName,
      birthday,
      paymentMethod,
      paypalEmail,
      wuMoneyGram,
      subscribers,
      profileImage, // base64 ou URL
      email,
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID manquant" });
    }

    // 🔐 Initialiser Octokit avec ton token GitHub
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/users/${uid}.json`;
    const contentData = {
      uid,
      firstName: firstName || "",
      lastName: lastName || "",
      penName: penName || "",
      birthday: birthday || "",
      email: email || "",
      paymentMethod: paymentMethod || "",
      paypalEmail: paypalEmail || "",
      wuMoneyGram: wuMoneyGram || {},
      subscribers: subscribers || [],
      profileImage: profileImage || "/avatar.png", // 🔹 image par défaut
      updatedAt: new Date().toISOString(),
    };

    // 🔍 Vérifier si le fichier existe déjà
    let sha = undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO,
        path,
      });
      sha = existingFile.sha;
    } catch (err) {
      // Fichier inexistant → nouvelle création
      console.log("Création d’un nouveau profil utilisateur sur GitHub…");
    }

    // 💾 Sauvegarde sur GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `Mise à jour du profil utilisateur ${uid}`,
      content: Buffer.from(JSON.stringify(contentData, null, 2)).toString("base64"),
      sha,
    });

    return res.status(200).json({ success: true, data: contentData });
  } catch (err) {
    console.error("Erreur GitHub API:", err);
    return res.status(500).json({ error: "Impossible de sauvegarder sur GitHub" });
  }
}