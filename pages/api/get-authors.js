import admin from "@/lib/firebaseAdmin"; // créer ce fichier si pas déjà fait

export default async function handler(req, res) {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const authors = listUsersResult.users.map((user) => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || null,
    }));

    res.status(200).json(authors);
  } catch (error) {
    console.error("Erreur récupération auteurs:", error);
    res.status(500).json({ error: "Impossible de récupérer les auteurs." });
  }
}