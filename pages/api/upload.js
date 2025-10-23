import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb" // limite taille image
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "fileName and fileData are required" });
    }

    // fileData doit être en base64
    const base64Data = fileData.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    const blob = await put(
      `images/${Date.now()}-${fileName}`,
      buffer,
      { access: "public" }
    );

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
}
