"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection"; // <-- section commentaires
import AdScript from "@/components/AdScript";
import { useAuth } from "@/context/AuthContext";

export default function ReadTextPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  // compteur de vues unique par utilisateur via localStorage
  useEffect(() => {
    if (!id) return;
    const viewed = JSON.parse(localStorage.getItem("viewedTexts") || "[]");
    if (!viewed.includes(id)) {
      localStorage.setItem("viewedTexts", JSON.stringify([...viewed, id]));
      fetch(`/api/increment-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: id }),
      });
    }
  }, [id]);

  // récupération du texte depuis GitHub
  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur de chargement");
        const found = json.data.find((t) => t.id === id);
        if (!found) throw new Error("Texte introuvable");
        setText(found);
      } catch (err) {
        console.error("Erreur :", err);
        toast.error("Impossible de charger ce texte.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Chargement du texte...
      </div>
    );

  if (!text)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-gray-500 mb-4">❌ Ce texte est introuvable.</p>
        <button
          onClick={() => router.push("/bibliotheque")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retour à la bibliothèque
        </button>
      </div>
    );

  const paragraphs = text.content.split("\n\n");

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      {/* Retour */}
      <button
        onClick={() => router.push("/bibliotheque")}
        className="text-sm text-blue-600 mb-4 hover:underline"
      >
        ← Retour à la bibliothèque
      </button>

      {/* Image */}
      {text.image && (
        <div className="w-full h-64 overflow-hidden rounded-xl mb-4">
          <img src={text.image} alt={text.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Titre */}
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>

      {/* Pub */}
      <AdScript />

      {/* Auteur, date, genre */}
      <div className="text-sm text-gray-500 mb-6 flex justify-between">
        <span>✍️ {text.author || "Auteur inconnu"}</span>
        <span>📅 {new Date(text.date).toLocaleDateString("fr-FR")}</span>
        <span>📚 {text.genre || "Genre inconnu"}</span>
      </div>

      {/* Contenu */}
      <article className="prose prose-gray max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
        {paragraphs.map((p, i) => (
          <div key={i}>
            <p>{p}</p>
            {i === 1 && <AdScript />}
          </div>
        ))}
      </article>

      {/* Pub à la fin */}
      <AdScript />

      {/* Compteurs et like */}
      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-4 text-gray-600 text-sm">
          <span>👁️ {text.views || 0} vues</span>
          <span>❤️ {text.likes || 0} likes</span>
          <span>💬 {text.comments || 0} commentaires</span>
        </div>

        {/* LikeButton */}
        <LikeButton textId={text.id} />
      </div>

      {/* Section Commentaires */}
      <div className="mt-8">
        <CommentSection textId={text.id} user={user} />
      </div>
    </main>
  );
}