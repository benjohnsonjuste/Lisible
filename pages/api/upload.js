import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { fileName, mimeType, base64 } = req.body;
    const buffer = Buffer.from(base64, "base64");

    const drive = google.drive({ version: "v3", auth: await auth.getClient() });

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

    // Rendre public
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const url = `https://drive.google.com/uc?id=${fileId}`;
    res.status(200).json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur upload" });
  }
}
