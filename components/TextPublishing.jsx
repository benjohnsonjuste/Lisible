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

    if (!title || !content) {
      toast.error("Le titre et le contenu sont requis.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Étape 1 : Insertion dans Supabase
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

      // ✅ Étape 2 : Envoi des métadonnées à Google Sheets
      await sendToSheets({
        title,
        subtitle,
        date: new Date().toISOString(),
        visibility,
        likes: 0,
        views: 0,
      });

      toast.success("🎉 Publication réussie et enregistrée dans Google Sheets !");
      setTitle("");
      setSubtitle("");
      setContent("");
    } catch (err) {
      console.error("Erreur de publication :", err.message);
      toast.error("Échec de la publication !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">✍️ Publier un texte</h1>

      <form onSubmit={handlePublish} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
            placeholder="Titre du texte"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Sous-titre</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
            placeholder="Sous-titre facultatif"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring h-40"
            placeholder="Écris ton texte ici..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Visibilité</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring"
          >
            <option value="public">Public</option>
            <option value="private">Privé</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Publication en cours..." : "Publier"}
        </button>
      </form>
    </div>
  );
}