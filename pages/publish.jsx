"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim()) return toast.error("Veuillez entrer votre nom d'auteur !");

    setLoading(true);
    try {
      const res = await fetch("/api/texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          authorName: authorName.trim(),
          authorId: "user-" + Date.now(),
          imageUrl: ""
        })
      });

      if (!res.ok) throw new Error("Erreur lors de la publication");

      setTitle("");
      setContent("");
      setAuthorName("");
      toast.success("Texte publié !");

      setTimeout(() => router.push("/texts"), 500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Publier un texte</h1>

      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Votre nom d'auteur"
        className="w-full p-2 border rounded"
        disabled={loading}
        required
      />

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du texte"
        className="w-full p-2 border rounded"
        disabled={loading}
        required
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Contenu du texte"
        className="w-full p-2 border rounded h-40"
        disabled={loading}
        required
      />

      <button
        type="submit"
        className={`btn btn-primary ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
      >
        {loading ? "Publication en cours..." : "Publier"}
      </button>
    </form>
  );
}