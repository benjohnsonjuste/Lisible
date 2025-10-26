import { createOrUpdateFile } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, content, authorName, authorId, imageBase64, imageName } = req.body;
  const id = Date.now();
  const textPath = `public/data/texts/${id}.json`;
  const imagePath = imageBase64
    ? `public/data/images/${id}.json`
    : null;

  try {
    const textData = {
      id,
      title,
      content,
      authorName,
      authorId,
      date: new Date().toISOString(),
      image: imageBase64 ? `/data/images/${id}.json` : null,
    };

    // Publier le texte
    await createOrUpdateFile({
      path: textPath,
      content: JSON.stringify(textData, null, 2),
      message: `📝 Publier texte ${title}`,
    });

    // Publier l'image si présente
    if (imageBase64 && imageName) {
      const imageData = {
        id,
        name: imageName,
        base64: imageBase64,
        linkedText: id,
      };
      await createOrUpdateFile({
        path: imagePath,
        content: JSON.stringify(imageData, null, 2),
        message: `🖼️ Ajouter image pour ${title}`,
      });
    }

    // Mise à jour de texts/index.json
    const indexPath = `public/data/texts/index.json`;
    const indexRes = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/${indexPath}`);
    const currentIndex = indexRes.ok ? await indexRes.json() : [];
    const updatedIndex = [
      { id, title, authorName, authorId, date: new Date().toISOString() },
      ...currentIndex,
    ];

    await createOrUpdateFile({
      path: indexPath,
      content: JSON.stringify(updatedIndex, null, 2),
      message: `📚 Mettre à jour index textes`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur API publish:", err);
    res.status(500).json({ error: "Erreur de publication" });
  }
}