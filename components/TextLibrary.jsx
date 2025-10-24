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

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/api/github-texts");
        if (!res.ok) throw new Error("Erreur récupération textes");
        const json = await res.json();
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

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement des textes...</p>;

  if (!texts.length)
    return <p className="text-center mt-10 text-gray-500">Aucun texte disponible.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {texts.map((text) => (
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
            <span>👁️ {text.views ?? 0}</span>
            <span>💬 {text.comments ?? 0}</span>
          </div>

          {/* LikeButton et commentaire */}
          <div className="flex justify-between items-center mb-2">
            <LikeButton textId={text.id} initialCount={text.likes ?? 0} />

            {session?.user ? (
              <Link
                href={`/texts/${text.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
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
  );
}