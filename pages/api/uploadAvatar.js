import { google } from "googleapis";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const { code, fileBase64, userId } = req.body;
    if (!code || !fileBase64 || !userId)
      return res.status(400).json({ error: "Données manquantes" });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const fileMetadata = {
      name: `avatar_${userId}.png`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = { mimeType: "image/png", body: Buffer.from(fileBase64, "base64") };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    const avatarUrl = `https://drive.google.com/uc?id=${file.data.id}`;
    await updateDoc(doc(db, "authors", userId), { avatarUrl });

    res.status(200).json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
}