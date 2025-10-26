"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function TextLibrary() {
  const [texts, setTexts] = useState([]);

  // Charger l'index des textes depuis GitHub ou public/data/texts/index.json
  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        const json = await res.json();
        // Trier par date décroissante
        setTexts(json.sort((a, b) => b.date - a.date));
      } catch (err) {
        console.error("Erreur chargement index des textes:", err);
      }
    };
    fetchIndex();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 grid gap-6 md:grid-cols-2">
      {texts.map((text) => (
        <TextCard key={text.id} text={text} />
      ))}
    </div>
  );
}

function TextCard({ text }) {
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);

  // Charger les vues et likes depuis Firestore en temps réel
  useEffect(() => {
    const metaRef = doc(db, "textsMeta", text.id);
    const unsubscribe = onSnapshot(metaRef, (snap) => {
      setViews(snap.data()?.views || 0);
      setLikes(snap.data()?.likes || 0);
    });
    return () => unsubscribe();
  }, [text.id]);

  // Formater la date de publication
  const formattedDate = new Date(text.date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h2 className="text-xl font-semibold">{text.title}</h2>
        <p className="text-sm text-gray-500 mb-2">
          ✍️{" "}
          <Link
            href={`/auteur/${text.authorId}`}
            className="text-blue-600 hover:underline"
          >
            {text.authorName}
          </Link>{" "}
          (ID: {text.authorId}) | 📚 {text.genre} | 🗓 {formattedDate}
        </p>
        <div className="flex items-center gap-4 text-sm mb-4">
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