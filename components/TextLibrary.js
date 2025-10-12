"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { sendToSheets } from "@/lib/sendToSheets";
import { Eye, Heart } from "lucide-react";

export default function Library() {
  const router = useRouter();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTexts();
  }, []);

  async function fetchTexts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("texts")
        .select("id, title, author, created_at, likes, views")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTexts(data || []);

      // ✅ Envoie les textes dans Google Sheets
      if (data?.length) {
        for (const text of data) {
          await sendToSheets({
            title: text.title,
            author: text.author,
            date: new Date(text.created_at).toISOString(),
            likes: text.likes || 0,
            views: text.views || 0,
          });
        }
      }

      console.log("✅ Données Library synchronisées avec Google Sheets");
    } catch (error) {
      console.error("❌ Erreur lors du chargement des textes :", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-center">Chargement de la bibliothèque...</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-center">Bibliothèque Lisible</h1>

      {texts.length === 0 ? (
        <p className="text-center text-gray-500">Aucun texte disponible.</p>
      ) : (
        <ul className="space-y-4">
          {texts.map((text) => (
            <li
              key={text.id}
              className="p-4 bg-white shadow rounded-lg cursor-pointer hover:bg-gray-50 transition"
              onClick={() => router.push(`/text/${text.id}`)}
            >
              <h2 className="text-lg font-semibold">{text.title}</h2>
              <p className="text-sm text-gray-600">par {text.author}</p>

              <div className="flex items-center gap-4 mt-2 text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {text.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={16} /> {text.likes || 0}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}