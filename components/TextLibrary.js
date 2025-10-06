"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function TextLibrary() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        const textsRef = collection(db, "texts");
        const q = query(
          textsRef,
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedTexts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTexts(fetchedTexts);
      } catch (error) {
        console.error("Erreur lors du chargement des textes :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p>Chargement des textes publiés...</p>
      </div>
    );
  }

  if (texts.length === 0) {
    return (
      <div className="text-center py-10">
        <p>Aucun texte publié pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {texts.map((text) => (
        <div
          key={text.id}
          className="border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          {text.coverUrl && (
            <img
              src={text.coverUrl}
              alt={text.title}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
          )}
          <h3 className="font-semibold text-lg mb-1">{text.title}</h3>
          {text.subtitle && <p className="text-sm text-muted mb-2">{text.subtitle}</p>}
          <p className="text-xs text-muted line-clamp-3">{text.content}</p>
          <p className="text-xs text-muted mt-2">
            Auteur : {text.authorEmail} | {text.wordCount} mots
          </p>
        </div>
      ))}
    </div>
  );
}