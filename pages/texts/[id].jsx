"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LikeButton from "@/components/LikeButton";
import { toast } from "sonner";
import CommentSection from "@/components/CommentSection";

export default function ReadTextPage() {
  const { id } = useParams();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur de chargement");

        const found = json.data.find((t) => t.id === id);
        if (!found) throw new Error("Texte introuvable");

        // Incrémenter vues uniques par utilisateur via localStorage
        const viewed = JSON.parse(localStorage.getItem("viewedTexts") || "[]");
        if (!viewed.includes(id)) {
          found.views = (found.views || 0) + 1;
          localStorage.setItem("viewedTexts", JSON.stringify([...viewed, id]));

          // Mettre à jour le compteur sur GitHub
          await fetch("/api/update-views", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ textId: id }),
          });
        }

        setText(found);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger ce texte.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id]);

  if (loading) return <p className="text-center mt-10 text-gray-500">Chargement...</p>;
  if (!text) return <p className="text-center mt-10 text-gray-500">Texte introuvable</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        ✍️ {text.authorName} | 📚 {text.genre} | 📅 {new Date(text.date).toLocaleDateString("fr-FR")}
      </p>

      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
      )}

      <article className="prose prose-gray max-w-none whitespace-pre-wrap mb-6">
        {text.content}
      </article>

      {/* Like */}
      <div className="mb-6">
        <LikeButton textId={text.id} initialCount={text.likes} />
      </div>

      {/* Commentaires */}
      <CommentSection textId={text.id} />
    </main>
  );
}