// components/TextPublishingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPublishingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convertir image en Base64
  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    setLoading(true);

    try {
      let imageBase64 = null;

      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
      }

      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          authorName: "Auteur inconnu",
          imageBase64,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur API");
      }

      toast.success("Texte publié !");
      setTitle("");
      setContent("");
      setImageFile(null);

      // 🔴 REDIRECTION VERS LA BIBLIOTHÈQUE
      router.push("/texts");
    } catch (err) {
      console.error(err);
      toast.error("❌ Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">Publier un texte</h2>

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <textarea
        placeholder="Écris ton texte ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}