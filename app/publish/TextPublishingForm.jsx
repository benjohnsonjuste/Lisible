"use client";

import React, { useState } from "react";
import { db, storage } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { sendToSheets } from "@/lib/sendToSheets";

export default function TextPublishingForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Vous devez être connecté pour publier un texte.");
      return;
    }

    if (!title || !content) {
      toast.error("Veuillez remplir le titre et le contenu.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      // ✅ Étape 1 — upload image vers Firebase Storage
      if (image) {
        const storageRef = ref(storage, `texts/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // ✅ Étape 2 — sauvegarde du texte dans Firestore
      const docRef = await addDoc(collection(db, "texts"), {
        title,
        type,
        excerpt,
        content,
        imageUrl,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        createdAt: serverTimestamp(),
        views: 0,
        status: "Publié",
      });

      // ✅ Étape 3 — enregistrement dans Google Sheets (métadonnées)
      await sendToSheets({
        title,
        type,
        author: user.displayName || "Auteur anonyme",
        date: new Date().toISOString(),
        imageUrl,
        excerpt,
      });

      toast.success("🎉 Texte publié avec succès !");
      setTitle("");
      setExcerpt("");
      setContent("");
      setImage(null);
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      toast.error("❌ Échec de la publication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="max-w-2xl mx-auto bg-white border rounded-lg shadow-sm p-6 space-y-4"
    >
      <h1 className="text-2xl font-bold mb-2 text-center">✍️ Publier un texte</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Titre du texte</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-md p-2"
          placeholder="Titre de ton texte"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type de texte</label>
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
        <label className="block text-sm font-medium mb-1">Extrait (facultatif)</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows="2"
          className="w-full border rounded-md p-2"
          placeholder="Résumé ou introduction..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image d’illustration</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full border rounded-md p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu principal</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="10"
          required
          className="w-full border rounded-md p-2"
          placeholder="Écris ou colle ton texte ici..."
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Publication en cours..." : "Publier le texte"}
      </Button>
    </form>
  );
      }
