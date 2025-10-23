import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import formidable from "formidable-serverless";
import fs from "fs";
import { uploadToVercelBlob } from "@/lib/vercelBlob";

export const config = {
  api: {
    bodyParser: false, // important pour FormData
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erreur parsing FormData" });

    try {
      const { title, content } = fields;
      let imageUrl = null;

      // Upload image vers Vercel Blob si présente
      if (files.image) {
        const file = files.image;
        const fileData = fs.readFileSync(file.filepath);
        const uploaded = await uploadToVercelBlob(fileData, file.originalFilename);
        imageUrl = uploaded.url;
      }

      // Sauvegarde dans Firestore
      await addDoc(collection(db, "texts"), {
        title,
        content,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      res.status(200).json({ message: "Texte publié !" });
    } catch (error) {
      console.error("Erreur publication:", error);
      res.status(500).json({ error: "Erreur lors de la publication" });
    }
  });
}