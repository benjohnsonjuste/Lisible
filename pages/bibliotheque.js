"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Impossible de charger l'index des textes");
        const json = await res.json();

        // Trier par date décroissante
        const sorted = [...json].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTexts(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTexts();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-600">Chargement de la bibliothèque...</div>;
  if (!texts.length) return <div className="text-center py-10 text-gray-600">Aucun texte publié.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6 md:grid-cols-2">
      {texts.map((text) => (
        <TextCard key={text.id} text={text} />
      ))}
    </div>
  );
}

function TextCard({ text }) {
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!text?.id) return;
    const metaRef = doc(db, "textsMeta", text.id);
    const unsubscribe = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
    });
    return () => unsubscribe();
  }, [text.id]);

  const authorName = text.authorName || "Auteur inconnu";
  const authorId = text.authorId || "inconnu";
  const imageUrl = text.image || "/default-placeholder.png";
  const formattedDate = text.date
    ? new Date(text.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "Date inconnue";

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition">
      <img src={imageUrl} alt={text.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-1">{text.title}</h2>
        <p className="text-sm text-gray-500 mb-2">
          ✍️{" "}
          <Link href={`/auteur/${authorId}`} className="text-blue-600 hover:underline">
            {authorName}
          </Link>{" "}
          | 🗓 {formattedDate}
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