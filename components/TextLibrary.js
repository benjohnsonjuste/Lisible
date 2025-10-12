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
  const [synced, setSynced] = useState(false); // 🔒 évite double synchronisation

  useEffect(() => {
    fetchTexts();
  }, []);

  async function fetchTexts() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("texts")
        .select("id, title, author, created_at, likes, views, visibility")
        .eq("visibility", "public") // 🔒 n'affiche que les textes publics
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTexts(data || []);

      // ✅ Étape 2 : Synchronisation avec Google Sheets (une seule fois)
      if (!synced && data?.length) {
        for (const text of data) {
          try {
            await sendToSheets({
              title: text.title,
              author: text.author || "Anonyme",
              date: new Date(text.created_at).toISOString(),
              likes: text.likes || 0,
              views: text.views || 0,
              visibility: text.visibility || "public",
            });
          } catch (err) {
            console.warn("Erreur d'envoi d’un texte à Google Sheets :", err.message);
          }
        }
        setSynced(true);
        console.log("✅ Bibliothèque synchronisée avec Google Sheets");
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des textes :", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Chargement de la bibliothèque...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">📚 Bibliothèque Lisible</h1>

      {texts.length === 0 ? (
        <p className="text-center text-gray-500">Aucun texte disponible pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {texts.map((text) => (
            <li
              key={text.id}
              className="p-4 bg-white shadow-sm rounded-xl cursor-pointer hover:bg-gray-50 transition"
              onClick={() => router.push(`/text/${text.id}`)}
            >
              <h2 className="text-lg font-semibold text-gray-800">{text.title}</h2>
              <p className="text-sm text-gray-600">
                par <span className="font-medium">{text.author || "Auteur inconnu"}</span>
              </p>

              <div className="flex items-center gap-6 mt-3 text-gray-500 text-sm">
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