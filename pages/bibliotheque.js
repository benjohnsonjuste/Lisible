"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageSquare } from "lucide-react";

export default function BibliothequePage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Impossible de charger les textes");
        const data = await res.json();
        setTexts(data);
      } catch (err) {
        console.error("Erreur de chargement:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTexts();
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Chargement...</p>;

  if (texts.length === 0)
    return (
      <p className="text-center mt-10 text-gray-600">
        Aucun texte publié pour le moment.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Bibliothèque Lisible
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map((text) => {
            const views =
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem(`viewers-${text.id}`) || "[]")
                    .length
                : 0;

            const likes =
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem(`likes-${text.id}`) || "[]")
                    .length
                : 0;

            const comments =
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem(`comments-${text.id}`) || "[]")
                    .length
                : 0;

            return (
              <div
                key={text.id}
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition"
              >
                {/* ✅ Affiche l’image seulement si elle existe */}
                {text.image && (
                  <div className="h-48 bg-gray-100">
                    <img
                      src={text.image}
                      alt={text.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold mb-2">{text.title}</h2>

                  <p className="text-sm text-gray-600 mb-1">
                    ✍️ {text.authorName || "Auteur inconnu"}
                  </p>

                  <p className="text-xs text-gray-400 mb-4">
                    Publié le{" "}
                    {new Date(text.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {/* Statistiques avec icônes Lucide */}
                  <div className="mt-auto flex items-center justify-between text-sm text-gray-600 border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Eye size={16} /> {views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={16} /> {likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={16} /> {comments}
                    </span>
                  </div>

                  {/* Bouton Lire */}
                  <Link
                    href={`/texts/${text.id}`}
                    className="mt-4 inline-block text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Lire
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}