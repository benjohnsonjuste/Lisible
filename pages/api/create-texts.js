import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    title,
    content,
    imageUrl,
    authorId,
    authorName
  } = req.body;

  if (!title || !content || !authorId) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  try {
    const docRef = await addDoc(collection(db, "texts"), {
      title,
      content,
      imageUrl: imageUrl || null,
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      views: 0,
      likesCount: 0,
      commentsCount: 0
    });

    res.status(200).json({ textId: docRef.id });
  } catch (e) {
    res.status(500).json({ error: "Erreur Firestore" });
  }
}
