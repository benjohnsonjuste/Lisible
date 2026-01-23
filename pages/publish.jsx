"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function PublishPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !title.trim() || !content.trim()) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    setLoading(true);

    try {
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await toBase64(imageFile);
      }

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          title: title.trim(),
          content: content.trim(),
          imageBase64
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      toast.success("Texte publié avec succès");
      
      setTimeout(() => {
        router.push("/librarybook");
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Publier un texte
        </h1>

        <input
          type="text"
          placeholder="Nom de l’auteur"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={loading}
          required
        />

        <input
          type="text"
          placeholder="Titre du texte"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={loading}
          required
        />

        <textarea
          placeholder="Contenu du texte"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          disabled={loading}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Image d'illustration (optionnel)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition disabled:opacity-50"
        >
          {loading ? "Publication en cours..." : "Publier sur la bibliothèque"}
        </button>
      </form>
    </div>
  );
}
