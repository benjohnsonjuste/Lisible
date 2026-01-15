"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PublishPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return <p className="p-6">Connexion requise</p>;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await addDoc(collection(db, "texts"), {
      title,
      content,
      imageUrl: imageUrl || null,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      createdAt: serverTimestamp(),
      views: 0,
      likesCount: 0,
      commentsCount: 0
    });

    router.push("/texts");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border p-2"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          className="w-full border p-2 h-40"
          placeholder="Contenu"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <input
          className="w-full border p-2"
          placeholder="URL image GitHub (optionnel)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <button
          className="bg-black text-white px-4 py-2"
          disabled={loading}
        >
          Publier
        </button>
      </form>
    </div>
  );
}
