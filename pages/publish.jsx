"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!authorName.trim() || !title.trim() || !content.trim()) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          authorName: authorName.trim()
        })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Réponse serveur invalide");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Erreur de publication");
      }

      toast.success("Texte publié avec succès");

      setTitle("");
      setContent("");
      setAuthorName("");

      router.push("/texts");

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
      className="bg-white p-6 rounded shadow max-w-lg mx-auto space-y-4"
    >
      <h1 className="text-2xl font-bold text-center">Publier un texte</h1>

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
        className="w-full p-2 border rounded h-40"
        disabled={loading}
        required
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