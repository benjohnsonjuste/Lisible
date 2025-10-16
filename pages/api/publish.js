import { google } from "googleapis";
import formidable from "formidable";
import fs from "fs";
import { uploadImageToDrive } from "@/lib/googleDrive";
import { addRowToSheet } from "@/lib/googleSheets";

export const config = {
  api: { bodyParser: false }, // nécessaire pour gérer les fichiers
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erreur de parsing du formulaire" });

    try {
      const { auteur, titre, contenu } = fields;
      const imageFile = files.image;

      let imageURL = "";
      if (imageFile) {
        imageURL = await uploadImageToDrive(imageFile.filepath, imageFile.originalFilename);
      }

      await addRowToSheet({ auteur, titre, contenu, imageURL });

      res.status(200).json({ message: "Publication réussie !" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });
}