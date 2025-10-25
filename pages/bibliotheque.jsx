"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import LikeButton from "@/components/LikeButton";

export default function BibliothequePage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tout");

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur récupération textes");
        setTexts(json.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger la bibliothèque");
      } finally {
        setLoading(false);
      }
    };
    fetchTexts();
  }, []);

  const filteredTexts =
    filter === "Tout" ? texts : texts.filter((t) => t.genre === filter);

  const genres = ["Tout", "Poésie", "Nouvelle", "Roman", "Article", "Essai"];

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement des textes...</p>;

  if (!texts.length)
    return <p className="text-center mt-10 text-gray-500">Aucun texte disponible.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">📚 Bibliothèque Lisible</h1>

      {/* Filtre par genre */}
      <div className="flex justify-center gap-4 mb-6">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1 rounded ${
              filter === g ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Liste des textes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTexts.map((text) => (
          <div
            key={text.id}
            className="bg-white rounded-2xl shadow p-4 flex flex-col"
          >
            {text.image && (
              <img
                src={text.image}
                alt={text.title}
                className="h-48 w-full object-cover rounded-xl mb-4"
              />
            )}
            <h2 className="text-xl font-semibold mb-1">{text.title}</h2>
            <p className="text-sm text-gray-500 mb-2">
              ✍️ {text.authorName} — 📚 {text.genre}
            </p>
            <p className="text-gray-700 mb-4 line-clamp-4">{text.content}</p>

            {/* Compteurs */}
            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <span>👁️ {text.views || 0}</span>
              <span>👍 {text.likes || 0}</span>
              <span>💬 {text.comments || 0}</span>
            </div>

            {/* Like et Lire la suite */}
            <div className="flex justify-between items-center mt-auto">
              <LikeButton textId={text.id} initialCount={text.likes} />
              <Link
                href={`/texts/${text.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                Lire la suite →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}