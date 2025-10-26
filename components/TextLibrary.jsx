"use client";

import { useEffect, useState } from "react";
import TextCard from "@/components/TextCard";

/**
 * Affiche la bibliothèque publique de tous les textes publiés
 */
export default function TextLibrary() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger la liste des textes depuis public/data/texts/index.json
  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const res = await fetch("/data/texts/index.json");
        if (!res.ok) throw new Error("Fichier index introuvable");
        const json = await res.json();

        // Tri par date décroissante (plus récents d'abord)
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