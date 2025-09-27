import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";
import path from "path";

// Désactive le body parser par défaut de Next.js pour gérer le fichier brut
export const config = {
  api: {
    bodyParser: false,
  },
};

// Dossier temporaire pour stocker le fichier avant upload
const uploadDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // 1. Parse le fichier reçu avec formidable
    const form = new formidable.IncomingForm({ uploadDir, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Erreur formidable:", err);
        return res.status(500).json({ error: "Erreur lors du parsing du fichier." });
      }

      const file = files.file;
      const authorId = fields.authorId;

      if (!file || !authorId) {
        return res.status(400).json({ error: "Fichier ou auteur manquant." });
      }

      // 2. Authentification Google Drive
      const KEYFILEPATH = path.join(process.cwd(), "google-service-account.json"); // Ton fichier JSON
      const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
      });

      const drive = google.drive({ version: "v3", auth });

      // 3. Upload vers Google Drive
      const fileMetadata = {
        name: `profile-${authorId}.jpg`,
        parents: ["TON_DOSSIER_ID"], // Remplace par l'ID du dossier Drive
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.filepath),
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id, webViewLink, webContentLink",
      });

      const fileId = response.data.id;

      // 4. Rendre le fichier accessible publiquement
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

      // 5. Supprimer le fichier temporaire
      fs.unlinkSync(file.filepath);

      // Retourner l'URL
      return res.status(200).json({ url: publicUrl });
    });
  } catch (error) {
    console.error("Erreur API upload:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}