"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import Image from "next/image";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("supabase"); // "supabase" | "firestore"

  // 🔄 Charger les textes à partir de Supabase ou Firestore
  useEffect(() => {
    const fetchTexts = async () => {
      setLoading(true);
      try {
        let results = [];

        if (source === "supabase") {
          const { data, error } = await supabase
            .from("texts")
            .select("*")
            .order("id", { ascending: false });

          if (error) throw error;
          results = data;
        } else {
          const snapshot = await getDocs(collection(db, "texts"));
          results = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        setTexts(results);
      } catch (error) {
        console.error("Erreur de chargement :", error);
        toast.error("Impossible de charger la bibliothèque.");
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
  }, [source]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Chargement des textes...</p>
      </div>
    );

  if (texts.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-gray-500 text-lg">Aucun texte publié pour l’instant.</p>
        <Button
          className="mt-4"
          onClick={() => (window.location.href = "/publish")}
        >
          Publier un texte
        </Button>
      </div>
    );

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Bibliothèque Lisible</h1>

        <select
          className="border rounded-md p-2 text-sm"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="supabase">Depuis Supabase</option>
          <option value="firestore">Depuis Firestore</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((text) => (
          <Card
            key={text.id}
            className="overflow-hidden hover:shadow-lg transition-all border"
          >
            {text.image_url || text.imageUrl ? (
              <div className="relative w-full h-48">
                <Image
                  src={text.image_url || text.imageUrl}
                  alt={text.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400 text-sm">
                Pas d’image
              </div>
            )}

            <div className="p-4 space-y-2">
              <h2 className="font-semibold text-lg line-clamp-1">{text.title}</h2>
              <p className="text-sm text-gray-500 italic">
                {text.author_name || text.authorName || "Auteur anonyme"}
              </p>
              <p className="text-gray-700 text-sm line-clamp-3">{text.excerpt}</p>

              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => {
                  window.location.href = `/read/${text.id}`;
                }}
              >
                Lire plus →
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
