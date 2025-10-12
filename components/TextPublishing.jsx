"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { sendToSheets } from "@/lib/sendToSheets";
import { toast } from "sonner";

export default function TextPublishing() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Étape 1 : Enregistrer le texte dans Supabase
      const { data, error } = await supabase
        .from("texts")
        .insert([
          {
            title,
            subtitle,
            content,
            visibility,
            likes: 0,
            views: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // ✅ Étape 2 : Enregistrer les métadonnées dans Google Sheets
      await sendToSheets({
        title,
        subtitle,
        content: content.slice(0, 100) + "...", // résumé
        date: new Date().toISOString(),
        visibility,
        likes: 0,
        views: 0,
      });

      toast.success("🎉 Publication réussie et enregistrée dans Google Sheets !");
      setTitle("");
      setSubtitle("");
      setContent("");
      setVisibility("public");
    } catch (err) {
      console.error("Erreur de publication :", err);
      toast.error("❌ Échec de la publication !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">✍️ Publier un texte</h1>

      <form onSubmit={handlePublish} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Titre du texte"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sous-titre</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            placeholder="Sous-titre facultatif"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 h-40"
            placeholder="Écris ton texte ici..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibilité</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="public">Public</option>
            <option value="private">Privé</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg font-medium text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Publication en cours..." : "Publier"}
        </button>
      </form>
    </div>
  );
}