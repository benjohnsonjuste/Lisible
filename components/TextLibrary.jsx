"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function TextLibrary() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger l'index des textes depuis GitHub (public/data/texts/index.json)
  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Fichier index introuvable");
        const json = await res.json();

        // Tri sécurisé (par date décroissante)
        const sorted = [...json].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.date || 0).getTime();
          return dateB - dateA;
        });

        setTexts(sorted);
      } catch (err) {
        console.error("❌ Erreur chargement index des textes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndex();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-600">
        Chargement de la bibliothèque...
      </div>
    );
  }

  if (!texts.length) {
    return (
      <div className="text-center py-10 text-gray-600">
        Aucun texte publié pour le moment.
      </div>
    );
  }

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

  // Charger les vues et likes depuis Firestore
  useEffect(() => {
    const metaRef = doc(db, "textsMeta", text.id);
    const unsubscribe = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
    });
    return () => unsubscribe();
  }, [text.id]);

  // Sécuriser les valeurs par défaut
  const authorName = text.authorName || "Auteur inconnu";
  const authorId = text.authorId || "inconnu";
  const imageUrl = text.image || text.imageUrl || "/default-placeholder.png";

  // Date lisible
  const formattedDate = text.createdAt || text.date
    ? new Date(text.createdAt || text.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date inconnue";

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition">
      <img
        src={imageUrl}
        alt={text.title}
        className="w-full h-48 object-cover"
      />

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