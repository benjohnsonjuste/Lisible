"use client";

import { useEffect, useState } from "react";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Erreur chargement index.json");
        const data = await res.json();
        setTexts(data);
      } catch (err) {
        console.error("Erreur chargement des textes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTexts();
  }, []);

  const handleShare = async (text) => {
    const shareData = {
      title: text.title,
      text: `Découvre "${text.title}" sur Lisible Club !`,
      url: `${window.location.origin}/texts/${text.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("📋 Lien copié dans le presse-papiers !");
      }
    } catch (err) {
      console.error("Erreur lors du partage :", err);
    }
  };

  if (loading)
    return (
      <div className="text-center py-10 text-gray-600">
        Chargement de la bibliothèque...
      </div>
    );

  if (!texts.length)
    return (
      <div className="text-center py-10 text-gray-600">
        Aucun texte publié pour le moment.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        📚 Bibliothèque Lisible
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((text) => (
          <div
            key={text.id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 p-4 flex flex-col"
          >
            {text.image && (
              <img
                src={text.image}
                alt={text.title}
                className="rounded-lg h-48 w-full object-cover mb-3"
              />
            )}

            <h2 className="text-lg font-semibold mb-2 line-clamp-1">
              {text.title}
            </h2>

            <p className="text-sm text-gray-600 mb-2">
              ✍️ Auteur :{" "}
              <span className="font-medium">
                {text.authorName || text.authorId || "Auteur inconnu"}
              </span>
            </p>
            <p className="text-xs text-gray-400 mb-3">
              🗓{" "}
              {text.date
                ? new Date(text.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Date inconnue"}
            </p>

            <p className="text-gray-700 text-sm flex-grow mb-3">
              {text.content?.slice(0, 150) || "Aucun contenu disponible..."}
              {text.content?.length > 150 && "..."}
            </p>

            <div className="flex items-center justify-between text-gray-600 text-sm mb-3">
              <span>👁️ {text.views || 0}</span>
              <span>💬 {text.comments || 0}</span>
            </div>

            <div className="flex gap-2">
              <a
                href={`/texts/${text.id}`}
                className="flex-1 text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Lire
              </a>
              <button
                onClick={() => handleShare(text)}
                className="flex items-center justify-center w-10 bg-gray-200 rounded hover:bg-gray-300 transition"
                title="Partager"
              >
                🔗
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}