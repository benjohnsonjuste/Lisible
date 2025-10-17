import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Exemple de traitement : log des données
    console.log("Auteur:", auteur);
    console.log("Titre:", titre);
    console.log("Contenu:", contenu);
    console.log("Image:", image?.filepath);

    // Tu peux ici uploader l'image vers Supabase, Cloudinary, etc.

    return res.status(200).json({ message: "Texte publié avec succès" });
  });
}