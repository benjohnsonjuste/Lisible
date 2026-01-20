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

  // 🔁 Convertir image → Base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
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

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Réponse serveur invalide");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Erreur serveur");
      }

      toast.success("✅ Texte publié avec succès");

      // 🔄 Reset formulaire
      setAuthorName("");
      setTitle("");
      setContent("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // 🔁 Redirection
      setTimeout(() => {
        router.push("/bibliotheque");
      }, 500);

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h1 className="text-2xl font-bold text-center">
        Publier un texte
      </h1>

      <input
        type="text"
        placeholder="Nom de l’auteur"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        className="w-full p-2 border rounded"
        disabled={loading}
        required
      />

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
        disabled={loading}
        required
      />

      <textarea
        placeholder="Contenu du texte"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full p-2 border rounded"
        disabled={loading}
        required
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}