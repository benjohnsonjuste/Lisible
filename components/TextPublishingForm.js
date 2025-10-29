"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPublishingForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const MAX_CHARACTERS = 50000;

  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

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
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    if (content.length > MAX_CHARACTERS) {
      toast.error(`Le texte ne doit pas dépasser ${MAX_CHARACTERS} caractères.`);
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour publier un texte.");
      router.push("/login?redirect=/bibliotheque");
      return;
    }

    setLoading(true);
    try {
      let imageBase64 = null;
      if (imageFile) imageBase64 = await toDataUrl(imageFile);

      const payload = {
        title,
        content,
        authorName: user.displayName || user.email || "Auteur inconnu",
        authorId: user.uid || null,
        imageBase64,
      };

      const res = await fetch("/api/publish-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec publication");

      toast.success("✅ Texte publié avec succès !");
      setTitle("");
      setContent("");
      setImageFile(null);
      router.push("/bibliotheque");
    } catch (err) {
      console.error("Erreur publication :", err);
      toast.error("❌ Impossible de publier le texte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold text-center">Publier un texte</h2>

      <input
        type="text"
        placeholder="Titre du texte"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <div className="relative">
        <textarea
          placeholder="Écris ton texte ici..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded"
          required
        />
        <div
          className={`absolute bottom-1 right-2 text-xs ${
            content.length > MAX_CHARACTERS ? "text-red-500" : "text-gray-500"
          }`}
        >
          {content.length}/{MAX_CHARACTERS}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </form>
  );
}