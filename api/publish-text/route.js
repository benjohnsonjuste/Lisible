import { put, list } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req) {
  const formData = await req.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const image = formData.get("image");

  let imageUrl = null;

  // 1️⃣ Enregistrer l’image dans le Blob
  if (image && typeof image === "object") {
    const { url } = await put(`texts/images/${Date.now()}-${image.name}`, image, {
      access: "public",
    });
    imageUrl = url;
  }

  // 2️⃣ Charger la liste actuelle des textes
  const existing = await list({ prefix: "texts/index.json" });
  let texts = [];

  if (existing.blobs.length > 0) {
    const res = await fetch(existing.blobs[0].url);
    texts = await res.json();
  }

  // 3️⃣ Ajouter le nouveau texte
  const newText = {
    id: Date.now(),
    title,
    content,
    imageUrl,
    createdAt: new Date().toISOString(),
  };
  texts.unshift(newText);

  // 4️⃣ Sauvegarder la liste mise à jour
  await put("texts/index.json", JSON.stringify(texts), {
    access: "public",
    contentType: "application/json",
  });

  return Response.json({ success: true, text: newText });
}
