// pages/api/uploadAvatar.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { code, imageBase64, fileName } = req.body;

    if (!code || !imageBase64) {
      return res.status(400).json({ error: "Code OAuth ou image manquante" });
    }

    // 1️⃣ Initialiser OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI // doit être identique à celui défini dans Google Cloud
    );

    // 2️⃣ Échanger le code contre un token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 3️⃣ Préparer le fichier à envoyer
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const buffer = Buffer.from(imageBase64, "base64");

    const fileMetadata = {
      name: fileName || "avatar.jpg",
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // dossier dédié aux avatars
    };

    const media = {
      mimeType: "image/jpeg",
      body: BufferToStream(buffer),
    };

    // 4️⃣ Upload sur Drive
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = response.data.id;

    // Rendre le fichier public (optionnel)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return res.status(200).json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Erreur uploadAvatar :", error);
    return res.status(500).json({ error: "Échec de l'upload" });
  }
}

// Utilitaire : convertir Buffer en ReadableStream
function BufferToStream(buffer) {
  const { Readable } = require("stream");
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}