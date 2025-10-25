"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function TextLibrary() {
  const { data: session } = useSession();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState("Tout");

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

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement des textes...</p>;

  const genres = ["Tout", "Poésie", "Nouvelle", "Roman", "Article", "Essai"];
  const filteredTexts =
    filterGenre === "Tout" ? texts : texts.filter((t) => t.genre === filterGenre);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-center mb-6 space-x-4">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setFilterGenre(g)}
            className={`px-3 py-1 rounded-full border ${
              filterGenre === g ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {filteredTexts.length === 0 && (
        <p className="text-center text-gray-500 mt-10">Aucun texte disponible.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Compteurs */}
            <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
              <span>👁️ {text.views || 0}</span>
              <span>💬 {text.comments || 0}</span>
            </div>

            {/* LikeButton et Commentaire */}
            <div className="flex justify-between items-center mb-2">
              <LikeButton textId={text.id} initialCount={text.likes} />
              {session?.user ? (
                <Link href={`/texts/${text.id}`} className="text-blue-600 hover:underline text-sm">
                  💬 Commenter
                </Link>
              ) : (
                <Link
                  href={`/login?callback=/texts/${text.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  💬 Connexion pour commenter
                </Link>
              )}
            </div>

            <Link
              href={`/texts/${text.id}`}
              className="mt-auto text-right text-blue-600 hover:underline text-sm"
            >
              Lire la suite →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}