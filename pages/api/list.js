import { google } from "googleapis";
import { Readable } from "stream";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export default async function handler(req, res) {
  try {
    const drive = google.drive({ version: "v3", auth: await auth.getClient() });

    // Liste tous les fichiers dans le dossier Lisible
    const response = await drive.files.list({
      q: `'${process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      fields: "files(id, name, mimeType, createdTime, webViewLink)",
      orderBy: "createdTime desc",
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error("Erreur Google Drive:", error);
    res.status(500).json({ error: "Impossible de lister les fichiers." });
  }
}