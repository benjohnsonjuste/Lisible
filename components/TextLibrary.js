"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Heart } from "lucide-react";
import { toast } from "sonner";

export default function TextLibrary() {
  const router = useRouter();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTexts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets");
      const data = await res.json();
      setTexts(data || []);
    } catch (err) {
      console.error("Erreur récupération Sheets :", err);
      toast.error("❌ Impossible de charger les textes depuis Sheets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTexts();
  }, []);

  const incrementField = async (rowIndex, field) => {
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, field }),
      });
      const result = await res.json();
      if (!result.success) throw new Error("Erreur API");
      // mettre à jour l'état
      setTexts((prev) =>
        prev.map((t, idx) =>
          idx === rowIndex ? { ...t, [field]: result.newValue } : t
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Impossible de mettre à jour le compteur.");
    }
  };

  const handleOpenText = (idx) => {
    incrementField(idx, "views");
    router.push(`/text/${idx}`);
  };

  const handleLike = (idx) => {
    incrementField(idx, "likes");
  };

  if (loading) return <p className="text-center py-10">Chargement...</p>;
  if (!texts.length) return <p className="text-center py-10">Aucun texte publié.</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">📚 Bibliothèque publique</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((text, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer"
            onClick={() => handleOpenText(idx)}
          >
            {text.cover_url && (
              <img
                src={text.cover_url}
                alt={text.title}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <h2 className="text-lg font-semibold">{text.title}</h2>
            {text.subtitle && <p className="text-sm text-muted mb-2">{text.subtitle}</p>}
            <p className="text-sm line-clamp-3 mb-3">{text.content}</p>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(idx);
                }}
                className="flex items-center gap-1 hover:text-red-500"
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
    </div>
  );
}