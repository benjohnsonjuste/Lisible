"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { toast } from "sonner";

export default function TextLibrary() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tout");

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur récupération textes");
        setTexts(json.data);
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

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement des textes...</p>;

  if (!texts.length)
    return <p className="text-center mt-10 text-gray-500">Aucun texte disponible.</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Bibliothèque Lisible</h1>

      {/* Filtre par genre */}
      <div className="flex justify-center gap-4 mb-6">
        {["Tout", "Poésie", "Nouvelle", "Roman", "Article", "Essai"].map((g) => (
          <button
            key={g}
            className={`px-4 py-2 rounded ${
              filter === g ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTexts.map((text) => (
          <div key={text.id} className="bg-white rounded-2xl shadow p-4 flex flex-col">
            {text.image && (
              <img
                src={text.image}
                alt={text.title}
                className="h-48 w-full object-cover rounded-xl mb-4"
              />
            )}
            <h2 className="text-xl font-semibold mb-1">{text.title}</h2>
            <p className="text-sm text-gray-500 mb-2">
              {text.authorName} — {text.genre}
            </p>
            <p className="text-gray-700 mb-4 line-clamp-4">{text.content}</p>

            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <span>👁️ {text.views || 0}</span>
              <span>💬 {text.comments || 0}</span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <LikeButton textId={text.id} initialCount={text.likes} />

              <Link
                href={`/texts/${text.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                Lire / Commenter
              </Link>
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin + `/texts/${text.id}`)}
              className="mt-auto text-right text-sm text-gray-500 hover:text-blue-600"
            >
              🔗 Partager
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}