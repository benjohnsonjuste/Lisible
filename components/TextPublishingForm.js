"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function TextPublishingForm({ textData }) {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState(textData?.title || "");
  const [content, setContent] = useState(textData?.content || "");
  const [genre, setGenre] = useState(textData?.genre || "poésie");
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
      let imageBase64 = textData?.imageBase64 || null;
      let imageName = textData?.imageName || null;

      if (imageFile) {
        imageBase64 = await toDataUrl(imageFile);
        imageName = imageFile.name;
      }

      const payload = {
        id: textData?.id || Date.now().toString(),
        title,
        content,
        genre,
        authorName: user?.displayName || user?.email || "Auteur inconnu",
        authorEmail: user?.email || "",
        imageBase64,
        imageName,
        likes: textData?.likes || 0,
        comments: textData?.comments || 0,
        date: new Date().toISOString(),
      };

      const res = await fetch("/api/publish-github", {
        method: textData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Publication échouée");

      toast.success("✅ Publication réussie !");
      router.push("/bibliotheque");
    } catch (err) {
      console.error("publish error", err);
      toast.error("❌ Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-4 border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-center text-blue-700">
        {textData ? "Modifier le texte" : "Publier un texte"}
      </h2>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du texte"
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="poésie">Poésie</option>
        <option value="nouvelle">Nouvelle</option>
        <option value="essai">Essai</option>
        <option value="article">Article</option>
        <option value="roman">Roman</option>
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Contenu du texte..."
        rows={8}
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
      />

      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />
        {textData?.image && !imageFile && (
          <img
            src={textData.image}
            alt="Image actuelle"
            className="h-40 w-full object-cover rounded-lg border"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300"
      >
        {loading ? "Publication..." : textData ? "Mettre à jour" : "Publier"}
      </button>
    </form>
  );
}