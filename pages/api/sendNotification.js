import admin from "firebase-admin";

// Initialisation Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title et body sont requis" });
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      topic: "clubPosts", // Tous les utilisateurs abonnés à ce topic recevront la notification
    };

    await admin.messaging().send(message);

    return res.status(200).json({ success: true, message: "Notification envoyée" });
  } catch (error) {
    console.error("Erreur envoi notification:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}