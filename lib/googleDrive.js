import { google } from "googleapis";
import fs from "fs";
import {
  GOOGLE_FOLDER_ID,
  GOOGLE_SERVICE_EMAIL,
  GOOGLE_PRIVATE_KEY,
} from "./config";

const auth = new google.auth.JWT(
  GOOGLE_SERVICE_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/drive"]
);

const drive = google.drive({ version: "v3", auth });

export async function uploadImageToDrive(filepath, filename) {
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [GOOGLE_FOLDER_ID] },
    media: {
      mimeType: "image/jpeg",
      body: fs.createReadStream(filepath),
    },
    fields: "id",
  });

  const fileId = res.data.id;

  // Rendre l’image accessible publiquement
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  return `https://drive.google.com/uc?id=${fileId}`;
}