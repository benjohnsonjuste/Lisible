import { google } from "googleapis";
import admin from "firebase-admin";

// Initialiser Firebase Admin une seule fois
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { oauthToken, fileName, fileType, fileData, userId } = req.body;

    if (!oauthToken || !fileData || !userId) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    // Authentification Google Drive
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: oauthToken });

    const drive = google.drive({ version: "v3", auth });

    // Envoi du fichier vers Google Drive
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: fileType,
        body: Buffer.from(fileData, "base64"),
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = uploadResponse.data.id;
    const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // Sauvegarder l'URL dans Firestore
    const db = admin.firestore();
    await db.collection("users").doc(userId).update({
      avatar: fileUrl,
    });

    res.status(200).json({ success: true, fileUrl });
  } catch (error) {
    console.error("Erreur uploadAvatar:", error);
    res.status(500).json({ error: "Erreur interne lors de l'upload" });
  }
}