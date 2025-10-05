"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig"; 
import { collection, getDocs, query, orderBy } from "firebase/firestore";

/**
 * PublishedTextsOverview : Affiche tous les textes publiés avec vues et popularité
 */
export default function PublishedTextsOverview() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const q = query(collection(db, "texts"), orderBy("publishedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const allTexts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            subtitle: data.subtitle,
            coverImage: data.coverImage,
            authorName: data.authorName,
            publishedAt: data.publishedAt,
            content: data.content,
            views: data.views || 0,
            previousViews: data.previousViews || 0,
          };
        });
        setTexts(allTexts);
      } catch (err) {
        console.error("Erreur récupération textes publiés:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  const calculatePopularity = (views, previousViews) => {
    if (previousViews === 0) return 100;
    return Math.round(((views - previousViews) / previousViews) * 100);
  };

  if (loading) return <p className="text-center py-6">Chargement des textes...</p>;
  if (texts.length === 0) return <p className="text-center py-6">Aucun texte publié pour le moment.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {texts.map((text) => {
        const popularity = calculatePopularity(text.views, text.previousViews);
        return (
          <div key={text.id} className="bg-card rounded-lg shadow p-4 flex flex-col">
            {text.coverImage && (
              <img
                src={text.coverImage}
                alt={text.title}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-lg font-bold mb-1">{text.title}</h3>
            {text.subtitle && <p className="text-sm text-muted mb-2">{text.subtitle}</p>}
            <p className="text-xs text-gray-500 mb-2">
              Par {text.authorName || "Auteur inconnu"} -{" "}
              {new Date(text.publishedAt?.toDate?.() || text.publishedAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700 line-clamp-3 mb-3">{text.content}</p>

            <div className="flex justify-between items-center text-sm">
              <span>Vues : {text.views}</span>
              <span
                className={`font-semibold ${
                  popularity > 0
                    ? "text-success"
                    : popularity < 0
                    ? "text-destructive"
                    : "text-muted"
                }`}
              >
                {popularity > 0 ? `+${popularity}%` : popularity === 0 ? "±0%" : `${popularity}%`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}