import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { title, content, authorName, authorId, imageBase64, imageName } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    // 🔹 Création d’un identifiant unique
    const id = Date.now();
    const date = new Date().toISOString();

    const newText = {
      id,
      title,
      content,
      authorName: authorName || "Auteur inconnu",
      authorId: authorId || null,
      date,
      image: imageBase64 || null,
      imageName: imageName || null,
    };

    // 1️⃣ — Sauvegarde du texte complet dans /public/data/texts/{id}.json
    const textPath = `public/data/texts/${id}.json`;
    await createOrUpdateFile({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: textPath,
      content: JSON.stringify(newText, null, 2),
      message: `📝 Nouveau texte: ${title}`,
    });

    // 2️⃣ — Lecture de l’index existant
    let indexData = [];
    try {
      const existing = await getFileContent({
        owner: "benjohnsonjuste",
        repo: "Lisible",
        path: "public/data/texts/index.json",
      });
      indexData = JSON.parse(existing || "[]");
    } catch {
      console.warn("Aucun fichier index.json trouvé, création d’un nouveau fichier.");
    }

    // 3️⃣ — Création du résumé du texte
    const newTextSummary = {
      id,
      title,
      authorName: newText.authorName,
      authorId: newText.authorId,
      date,
      image: newText.image || null,
    };

    // 4️⃣ — Ajout du texte dans l’index (en tête de liste)
    const updatedIndex = [newTextSummary, ...indexData];

    // 5️⃣ — Sauvegarde de l’index mis à jour
    await createOrUpdateFile({
      owner: "benjohnsonjuste",
      repo: "Lisible",
      path: "public/data/texts/index.json",
      content: JSON.stringify(updatedIndex, null, 2),
      message: `📚 Index mis à jour: ${title}`,
    });

    console.log(`✅ Texte publié : ${title}`);
    return res.status(200).json({ success: true, textId: id });
  } catch (error) {
    console.error("Erreur de publication:", error);
    return res.status(500).json({ error: "Erreur lors de la publication" });
  }
}