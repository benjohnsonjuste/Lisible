"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Affiche une carte individuelle pour un texte
 */
export default function TextCard({ text }) {
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);

  // 🔥 Écoute en temps réel des compteurs Firestore
  useEffect(() => {
    if (!text?.id) return;
    const metaRef = doc(db, "textsMeta", text.id);
    const unsubscribe = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
    });
    return () => unsubscribe();
  }, [text?.id]);

  const authorName = text.authorName || "Auteur inconnu";
  const authorId = text.authorId || "inconnu";
  const imageUrl = text.image || text.imageUrl || "/default-placeholder.png";

  const formattedDate = text.createdAt || text.date
    ? new Date(text.createdAt || text.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date inconnue";

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={text.title}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-4">
        <h2 className="text-xl font-semibold mb-1">{text.title}</h2>

        <p className="text-sm text-gray-500 mb-2">
          ✍️{" "}
          <Link
            href={`/auteur/${authorId}`}
            className="text-blue-600 hover:underline"
          >
            {authorName}
          </Link>{" "}
          (ID: {authorId}) | 🗓 {formattedDate}
        </p>

        <div className="flex items-center gap-4 text-sm mb-4 text-gray-600">
          <span>👁️ {views}</span>
          <span>👍 {likes}</span>
        </div>

        <Link
          href={`/texts/${text.id}`}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lire
        </Link>
      </div>
    </div>
  );
}