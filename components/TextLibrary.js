"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Heart } from "lucide-react";

export default function TextLibrary() {
  const router = useRouter();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTexts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("texts")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (error) console.error("Erreur chargement :", error.message);
    else setTexts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const incrementViews = async (id) => {
    const { error } = await supabase
      .from("texts")
      .update({ views: supabase.raw("views + 1") })
      .eq("id", id);

    if (error) console.error("Erreur vues :", error.message);
    else setTexts(prev => prev.map(t => t.id === id ? { ...t, views: t.views + 1 } : t));
  };

  const toggleLike = async (id, currentLikes) => {
    const { error } = await supabase
      .from("texts")
      .update({ likes: currentLikes + 1 })
      .eq("id", id);

    if (error) console.error("Erreur like :", error.message);
    else setTexts(prev => prev.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
  };

  const handleOpenText = async (id) => {
    await incrementViews(id);
    router.push(`/text/${id}`);
  };

  if (loading) return <p className="text-center py-10">Chargement...</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">📚 Bibliothèque publique</h1>
      {texts.length === 0 ? (
        <p>Aucun texte publié pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map(text => (
            <div key={text.id} className="bg-white p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer" onClick={() => handleOpenText(text.id)}>
              {text.coverUrl && <img src={text.coverUrl} alt={text.title} className="w-full h-40 object-cover rounded-lg mb-3" />}
              <h2 className="text-lg font-semibold">{text.title}</h2>
              {text.subtitle && <p className="text-sm text-muted mb-2">{text.subtitle}</p>}
<p className="text-sm line-clamp-3 mb-3">{text.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                <button
                  className="flex items-center gap-1 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(text.id, text.likes || 0);
                  }}
                >
                  <Heart size={16} /> {text.likes || 0}
                </button>
                <div className="flex items-center gap-1">
                  <Eye size={16} /> {text.views || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}