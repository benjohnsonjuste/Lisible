import { google } from "googleapis";

export async function POST(req) {
  try {
    const { fileName, mimeType, base64 } = await req.json();

    // Authenticate with Google Drive using service account
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: fileName,
      // parents: ["YOUR_GOOGLE_DRIVE_FOLDER_ID"], // Optional: Specify a folder ID
    };

    const media = {
      mimeType,
      body: Buffer.from(base64, "base64"),
    };

    // Upload file to Google Drive
    const driveRes = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: driveRes.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Generate public URL
    const url = `https://drive.google.com/uc?id=${driveRes.data.id}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur d'upload vers Google Drive :", err);
    return new Response(JSON.stringify({ error: "Échec de l'upload" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}