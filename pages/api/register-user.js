import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { name, email, password, joinedAt } = req.body;
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const cleanEmail = email.toLowerCase().trim();
  const fileName = Buffer.from(cleanEmail).toString('base64').replace(/=/g, "") + ".json";

  const newUserProfile = {
    name,
    penName: name,
    email: cleanEmail,
    password, 
    birthday: "", // À remplir par l'utilisateur dans Account
    joinedAt: joinedAt || new Date().toISOString(),
    profilePic: "",
    role: "author",

    stats: {
      totalTexts: 0,
      totalViews: 0,
      subscribers: 0,
      subscribersList: [],
      totalCertified: 0,
      rank: "Novice"
    },

    wallet: {
      balance: 0,
      totalEarned: 0,
      currency: "Li",
      isMonetized: false,
      canWithdraw: false,
      history: [
        {
          date: new Date().toISOString(),
          type: "system",
          amount: 0,
          label: "Initialisation du compte"
        }
      ]
    },

    prestige: {
      badges: [],
      achievements: {
        hasPublished: false,
        isPartner: cleanEmail === "cmo.lablitteraire7@gmail.com",
        isMecene: false
      }
    }
  };

  try {
    // Écriture du fichier sur le dépôt
    await octokit.repos.createOrUpdateFileContents({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: `data/users/${fileName}`,
      message: `✨ Nouveau membre : ${name}`,
      content: Buffer.from(JSON.stringify(newUserProfile, null, 2)).toString("base64"),
    });

    return res.status(200).json({ success: true, user: newUserProfile });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
