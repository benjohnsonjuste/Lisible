// lib/googleDrive.js
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export async function uploadFile(fileName, mimeType, buffer) {
  const drive = google.drive({ version: "v3", auth: await auth.getClient() });

  // 🔹 Upload du fichier
  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID],
      mimeType,
    },
    media: {
      mimeType,
      body: buffer,
    },
    fields: "id",
  });

  const fileId = file.data.id;

  // 🔹 Rendre le fichier public
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return `https://drive.google.com/uc?id=${fileId}`;
  }
