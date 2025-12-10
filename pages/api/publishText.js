import { db, storage, auth } from "@/lib/firebaseConfig";
import { commitTextToGithub } from "@/lib/github";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, content, imageBase64, user } = req.body;

    if (!title || !content || !user) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    let imageURL = null;

    // Upload de l'image si présente
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64.split(",")[1], "base64");
      const storageRef = ref(storage, `texts/images/${Date.now()}-${user.id}.png`);
      await uploadBytes(storageRef, buffer, { contentType: "image/png" });
      imageURL = await getDownloadURL(storageRef);
    }

    // Génération ID unique
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const textData = {
      id,
      title,
      content,
      image: imageURL,
      author: {
        id: user.uid,
        name: user.displayName || user.email,
      },
      date: Date.now(),
    };

    // Enregistrement Firestore
    await addDoc(collection(db, "texts"), textData);

    // Commit sur GitHub
    const githubFormat = {
      id,
      title,
      content,
      image: imageURL,
      date: new Date().toISOString(),
      author: {
        id: user.uid,
        name: user.displayName || user.email,
      },
    };
    await commitTextToGithub(`data/texts/${id}.json`, githubFormat);

    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Erreur publishText:", error);
    res.status(500).json({ error: error.message });
  }
}