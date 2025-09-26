// pages/api/upload.js
import { getGoogleDrive } from "@/lib/googleDrive";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const drive = getGoogleDrive();
    const folderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID;

    const { fileName, fileData } = req.body;

    const buffer = Buffer.from(fileData, "base64");

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: "application/octet-stream",
      body: buffer,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name",
    });

    return res.status(200).json({
      message: "Fichier uploadé avec succès",
      file: response.data,
    });
  } catch (error) {
    console.error("Erreur upload Google Drive:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
