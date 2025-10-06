"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Heart } from "lucide-react";

export default function TextPage() {
  const { id } = useParams();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchText = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("texts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erreur chargement texte :", error.message);
    } else {
      setText(data);
      await supabase
        .from("texts")
        .update({ views: data.views + 1 })
        .eq("id", id);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchText();
  }, [id]);

  if (loading) return <p className="text-center py-10">Chargement...</p>;
  if (!text) return <p className="text-center py-10">Texte introuvable.</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 max-w-3xl mx-auto">
      {text.coverUrl && (
        <img
          src={text.coverUrl}
          alt={text.title}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
      )}
      <h1 className="text-3xl font-bold mb-2 text-gray-900">{text.title}</h1>
      {text.subtitle && (
        <h2 className="text-lg text-muted mb-4">{text.subtitle}</h2>
      )}
      <div className="text-sm text-gray-600 mb-6 flex gap-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Heart size={16} /> {text.likes || 0}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={16} /> {text.views || 0}
        </span>
        {text.category && <span>🗂️ {text.category}</span>}
        {text.tags?.length > 0 && <span>🏷️ {text.tags.join(", ")}</span>}
      </div>
      <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
        {text.content}
      </div>
    </div>
  );
    }
