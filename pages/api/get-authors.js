import { Octokit } from "@octokit/rest";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  try {
    // 1️⃣ Récupérer les auteurs depuis Firebase
    const authorsSnapshot = await getDocs(collection(db, "authors"));
    const firebaseAuthors = authorsSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    // 2️⃣ Récupérer les données GitHub pour chaque auteur
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const githubAuthors = [];

    for (const author of firebaseAuthors) {
      const path = `data/users/${author.uid}.json`;

      try {
        const { data } = await octokit.repos.getContent({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path,
        });

        // Décoder et parser le contenu JSON
        const content = JSON.parse(
          Buffer.from(data.content, "base64").toString("utf-8")
        );

        githubAuthors.push({
          ...author,
          ...content, // fusion des infos GitHub + Firebase
        });
      } catch (err) {
        // Si le fichier GitHub n'existe pas encore → juste Firebase
        githubAuthors.push(author);
      }
    }

    // 3️⃣ Retourner tous les auteurs (fusionnés)
    return res.status(200).json(githubAuthors);
  } catch (error) {
    console.error("Erreur /api/get-authors :", error);
    return res.status(500).json({
      error: "Impossible de récupérer les auteurs.",
      details: error.message,
    });
  }
}