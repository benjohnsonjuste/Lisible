"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function TextPublishingForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔥 Fonction pour publier le texte
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("Vous devez être connecté pour publier un texte.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await addDoc(collection(db, "texts"), {
        title,
        type,
        excerpt,
        content,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        createdAt: serverTimestamp(),
        views: 0,
        status: "Publié",
      });

      setMessage("✅ Texte publié avec succès !");
      setTitle("");
      setExcerpt("");
      setContent("");
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      setMessage("❌ Échec de la publication. Veuillez réessayer.");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-card border rounded-lg shadow-sm p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Titre du texte</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-md p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Type de texte
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border rounded-md p-2"
        >
          <option>Roman</option>
          <option>Nouvelle</option>
          <option>Poésie</option>
          <option>Essai</option>
          <option>Article</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Extrait</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows="2"
          className="w-full border rounded-md p-2"
          placeholder="Résumé ou introduction..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Contenu principal
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="8"
          className="w-full border rounded-md p-2"
          placeholder="Écrivez ou collez votre texte ici..."
          required
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Publication..." : "Publier le texte"}
        </Button>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.startsWith("✅")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}