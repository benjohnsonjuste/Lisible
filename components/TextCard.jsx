"use client";

import Link from "next/link";
import LikeButton from "@/components/LikeButton";

export default function TextCard({ text }) {
  if (!text) return null;

  return (
    <div className="p-4 bg-white rounded-2xl shadow hover:shadow-md transition-all duration-200 space-y-3 w-full max-w-2xl mx-auto">
      {/* Image d’illustration */}
      {text.image && (
        <div className="w-full h-56 overflow-hidden rounded-xl">
          <img
            src={text.image}
            alt={text.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Titre */}
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
        {text.title}
      </h3>

      {/* Extrait du texte */}
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
        {text.excerpt || text.content?.slice(0, 200) + "..."}
      </p>

      {/* Bas de la carte */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span>✍️ {text.author || "Auteur inconnu"}</span>
          <span className="ml-2">
            📅 {new Date(text.date).toLocaleDateString("fr-FR")}
          </span>
        </div>

        <LikeButton textId={text.id} />
      </div>

      {/* Bouton “Lire plus” */}
      <div className="pt-3">
        <Link
          href={`/texte/${text.id}`}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          Lire la suite →
        </Link>
      </div>
    </div>
  );
}