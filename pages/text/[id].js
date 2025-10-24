"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LikeButton from "@/components/LikeButton";
import { toast } from "sonner";
import AdScript from "@/components/AdScript"; // <-- import du composant pub

export default function ReadTextPage() {
  const { id } = useParams();
  const router = useRouter();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch(`/api/github-texts`);
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

  // Séparer le contenu en paragraphes pour insérer la pub
  const paragraphs = text.content.split("\n\n");

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      {/* Bouton retour */}
      <button
        onClick={() => router.push("/bibliotheque")}
        className="text-sm text-blue-600 mb-4 hover:underline"
      >
        ← Retour à la bibliothèque
      </button>

      {/* Image d’illustration */}
      {text.image && (
        <div className="w-full h-64 overflow-hidden rounded-xl mb-4">
          <img
            src={text.image}
            alt={text.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Titre */}
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>

      {/* Pub sous le titre */}
      <AdScript />

      {/* Auteur et date */}
      <div className="text-sm text-gray-500 mb-6 flex justify-between">
        <span>✍️ {text.author || "Auteur inconnu"}</span>
        <span>📅 {new Date(text.date).toLocaleDateString("fr-FR")}</span>
      </div>

      {/* Contenu complet avec pub après le 2e paragraphe */}
      <article className="prose prose-gray max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
        {paragraphs.map((p, i) => (
          <div key={i}>
            <p>{p}</p>
            {i === 1 && <AdScript />} {/* Pub après le 2e paragraphe */}
          </div>
        ))}
      </article>

      {/* Pub à la fin */}
      <AdScript />

      {/* Section Like */}
      <div className="mt-6 flex justify-end">
        <LikeButton textId={text.id} />
      </div>
    </main>
  );
}