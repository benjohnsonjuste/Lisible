"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function TextPublishingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState("AuteurTest"); // Remplace par login GitHub ou pseudo

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !content) return toast.error("Titre et contenu requis");

    setLoading(true);
    let imageBase64 = null;

    if (imageFile) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imageFile);
      });
    }

    try {
      const res = await fetch("/api/publishText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, imageBase64, author: authorName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      toast.success("Texte publié avec succès !");
      router.push(`/texts/${data.id}`);
    } catch (err) {
      toast.error(err.message || "Échec de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Publier un texte</h1>
        <form onSubmit={handlePublish} className="space-y-4">
          <input
            type="text"
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <textarea
            rows={10}
            placeholder="Contenu"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Publication..." : "Publier"}
          </button>
        </form>
      </div>
    </div>
  );
}