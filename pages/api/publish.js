import formidable from "formidable";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Erreur de parsing du formulaire" });
    }

    const { auteur, titre, contenu } = fields;
    const image = files.image;

    if (!auteur || !titre || !contenu) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    let image_url = null;

    if (image && image.filepath) {
      const fileExt = image.originalFilename.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(image.filepath);

      const { data, error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, fileBuffer, {
          contentType: image.mimetype,
        });

      if (uploadError) {
        console.error("Erreur d'upload image:", uploadError.message);
        return res.status(500).json({ error: "Échec de l'upload de l'image" });
      }

      image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
    }

    const { error: insertError } = await supabase.from("texts").insert([
      {
        auteur,
        titre,
        contenu,
        image_url,
      },
    ]);

    if (insertError) {
      console.error("Erreur d'insertion Supabase:", insertError.message);
      return res.status(500).json({ error: "Échec de l'enregistrement du texte" });
    }

    return res.status(200).json({ message: "Texte publié avec succès" });
  });
}