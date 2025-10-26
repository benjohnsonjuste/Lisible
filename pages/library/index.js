"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewsMap, setViewsMap] = useState({});
  const [likesMap, setLikesMap] = useState({});

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Fichier index introuvable");
        const json = await res.json();

        // Tri par date décroissante
        const sorted = [...json].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTexts(sorted);
      } catch (err) {
        console.error("❌ Erreur chargement index des textes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIndex();
  }, []);

  // Charger les vues et likes pour chaque texte depuis Firestore
  useEffect(() => {
    const unsubscribes = texts.map((text) => {
      if (!text?.id) return () => {};
      const metaRef = doc(db, "textsMeta", text.id);
      return onSnapshot(metaRef, (snap) => {
        const data = snap.data() || {};
        setViewsMap((prev) => ({ ...prev, [text.id]: data.views || 0 }));
        setLikesMap((prev) => ({ ...prev, [text.id]: data.likes || 0 }));
      });
    });

    return () => unsubscribes.forEach((u) => u && u());
  }, [texts]);

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (!texts.length) return <div className="text-center py-10">Aucun texte publié.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">📚 Bibliothèque Lisible</h1>
      <div className="max-w-5xl mx-auto p-6 grid gap-6 md:grid-cols-2">
        {texts.map((text) => {
          const authorName = text.authorName || "Auteur inconnu";
          const authorId = text.authorId || "inconnu";
          const imageUrl = text.image || text.imageUrl || "/default-placeholder.png";
          const formattedDate = text.date
            ? new Date(text.date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "Date inconnue";

          return (
            <div
              key={text.id}
              className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition"
            >
              <img src={imageUrl} alt={text.title} className="w-full h-48 object-cover" />
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
                  | 🗓 {formattedDate}
                </p>
                <div className="flex items-center gap-4 text-sm mb-4 text-gray-600">
                  <span>👁️ {viewsMap[text.id] || 0}</span>
                  <span>👍 {likesMap[text.id] || 0}</span>
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
        })}
      </div>
    </div>
  );
}