// pages/author-dashboard/text-publishing/index.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { commitTextToGithub } from "@/lib/github";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TextPublishingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Le titre et le contenu sont obligatoires.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("Vous devez être connecté pour publier.");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Upload image si présente
      let imageURL = null;
      if (imageFile) {
        const storageRef = ref(storage, `texts/images/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
      }

      // 2️⃣ Générer un ID unique pour le texte
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
        date: serverTimestamp(),
      };

      // 3️⃣ Enregistrer dans Firestore
      await addDoc(collection(db, "texts"), textData);

      // 4️⃣ Préparer JSON pour GitHub
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

      toast.success("Texte publié avec succès !");
      router.push(`/texts/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Publier un texte
        </h1>

        <form className="space-y-4" onSubmit={handlePublish}>
          <div>
            <label className="font-semibold">Titre</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold">Contenu</label>
            <textarea
              rows={10}
              className="w-full border rounded p-2 whitespace-pre-line"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold">Image (optionnelle)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            {loading ? "Publication..." : "Publier"}
          </button>
        </form>
      </div>
    </div>
  );
}