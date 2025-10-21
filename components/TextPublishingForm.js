"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { sendToSheets } from "@/lib/sendToSheets";
import { toast } from "sonner";

export default function TextPublishingForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";
      if (image) {
        const storageRef = ref(storage, `images/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 1️⃣ Enregistrer dans Firestore
      await addDoc(collection(db, "texts"), {
        title,
        excerpt,
        content,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Enregistrer dans Google Sheets
      await sendToSheets({
        title,
        authorName: "Auteur inconnu",
        excerpt,
        imageUrl,
      });

      toast.success("✅ Texte publié avec succès !");
      setTitle("");
      setExcerpt("");
      setContent("");
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error("❌ Échec de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePublish} className="space-y-4 max-w-xl mx-auto mt-10">
      <h1 className="text-2xl font-bold">Publier un texte</h1>

      <input
        type="text"
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded-md"
        required
      />

      <textarea
        placeholder="Extrait"
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        rows="3"
        className="w-full border p-2 rounded-md"
      />

      <textarea
        placeholder="Contenu complet"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows="8"
        className="w-full border p-2 rounded-md"
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}