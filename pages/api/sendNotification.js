import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  const { title, body } = req.body;

  try {
    await admin.messaging().sendToTopic("clubPosts", {
      notification: { title, body },
    });

    res.status(200).json({ success: true, message: "Notification envoyée" });
  } catch (error) {
    console.error("Erreur notification :", error);
    res.status(500).json({ success: false, error: error.message });
  }
}