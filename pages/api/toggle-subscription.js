import { Octokit } from "octokit";
import { db } from "@/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { follower, author } = req.body;
    if (!follower?.uid || !author?.uid)
      return res.status(400).json({ error: "Informations manquantes" });

    const followerRef = doc(
      db,
      "users",
      follower.uid,
      "subscriptions",
      author.uid
    );

    const docSnap = await getDoc(followerRef);
    let isFollowing = false;

    if (docSnap.exists()) {
      await deleteDoc(followerRef);
    } else {
      await setDoc(followerRef, {
        authorId: author.uid,
        authorEmail: author.email,
        authorName: author.name || author.email,
        createdAt: new Date().toISOString(),
      });
      isFollowing = true;
    }

    // --- 🔹 GitHub sync
    const octokit = new Octokit({
      auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    });

    const path = `data/subscriptions/${author.uid}.json`;
    let existing = { authorId: author.uid, followers: [] };
    let sha = undefined;

    try {
      const { data: fileData } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path,
        }
      );
      existing = JSON.parse(
        Buffer.from(fileData.content, "base64").toString("utf8")
      );
      sha = fileData.sha;
    } catch {
      // nouveau fichier
    }

    if (isFollowing) {
      if (!existing.followers.find((f) => f.uid === follower.uid)) {
        existing.followers.push({
          uid: follower.uid,
          name: follower.name || follower.email,
          email: follower.email,
          photoURL: follower.photoURL || "/avatar.png",
        });
      }
    } else {
      existing.followers = existing.followers.filter(
        (f) => f.uid !== follower.uid
      );
    }

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path,
      message: `${isFollowing ? "Abonnement" : "Désabonnement"} de ${
        follower.email
      } à ${author.uid}`,
      content: Buffer.from(JSON.stringify(existing, null, 2)).toString("base64"),
      sha,
    });

    return res.status(200).json({
      success: true,
      isFollowing,
      followersCount: existing.followers.length,
    });
  } catch (err) {
    console.error("Erreur toggle-subscription:", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
}