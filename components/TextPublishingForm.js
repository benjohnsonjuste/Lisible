"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPublishingForm({ user }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Titre et contenu requis");
      return;
    }

    setLoading(true);
    try {
      let imageBase64 = null;
      let imageName = null;

      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      const payload = {
        title,
        content,
        authorName: user?.name || "Auteur inconnu",
        authorId: user?.id || null,
        imageBase64,
        imageName,
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur de publication");

      toast.success("✅ Publication réussie !");
      router.push("/library");
    } catch (err) {
      console.error(err);
      toast.error("❌ Échec de publication");
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
      />

      <textarea
        placeholder="Écris ton texte ici..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full p-2 border rounded"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}