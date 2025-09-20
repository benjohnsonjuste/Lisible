// pages/api/uploadAvatar.js
import { google } from "googleapis";
import { getFirestore, doc, updateDoc } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Initialiser Firebase Admin si pas encore fait
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { code, imageBase64, fileName, userId } = req.body;

    if (!code || !imageBase64 || !userId) {
      return res.status(400).json({ error: "Données manquantes (code, image, userId)" });
    }

    // 1️⃣ Configurer OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const buffer = Buffer.from(imageBase64, "base64");

    const fileMetadata = {
      name: fileName || "avatar.jpg",
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "image/jpeg",
      body: BufferToStream(buffer),
    };

    // 2️⃣ Upload sur Drive
    const uploaded = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    const fileId = uploaded.data.id;

    // 3️⃣ Rendre public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    // 4️⃣ Sauvegarde dans Firestore
    const db = getFirestore();
    await updateDoc(doc(db, "users", userId), {
      avatar: publicUrl,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Erreur uploadAvatar :", error);
    return res.status(500).json({ error: "Échec de l'upload ou de l'enregistrement Firestore" });
  }
}

// Convertir Buffer en stream
function BufferToStream(buffer) {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}