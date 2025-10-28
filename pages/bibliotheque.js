"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
          📚 Bibliothèque Lisible
        </h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map((text) => {
            const views =
              typeof window !== "undefined"
                ? localStorage.getItem(`views-${text.id}`) || 0
                : 0;

            const comments =
              typeof window !== "undefined"
                ? JSON.parse(localStorage.getItem(`comments-${text.id}`) || "[]")
                    .length
                : 0;

            return (
              <div
                key={text.id}
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-gray-100">
                  <img
                    src={text.image || "/default-placeholder.png"}
                    alt={text.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h2 className="text-lg font-semibold mb-2">{text.title}</h2>

                  <p className="text-sm text-gray-600 mb-2">
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

                  <div className="mt-auto flex items-center justify-between text-sm text-gray-600">
                    <span>👁️ {views} vues</span>
                    <span>💬 {comments} commentaires</span>
                  </div>

                  <Link
                    href={`/texts/${text.id}`}
                    className="mt-4 inline-block text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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