"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";
import { sendToSheets } from "@/lib/sendToSheets";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function TextPublishingForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 📤 Fonction principale : publier le texte
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("⚠️ Vous devez être connecté pour publier un texte.");
      return;
    }

    if (!title || !content) {
      toast.error("Le titre et le contenu sont requis !");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // ✅ 1. Upload image vers Supabase Storage (si présente)
      if (image) {
        const fileName = `${user.uid}_${Date.now()}_${image.name}`;
        const { data, error } = await supabase.storage
          .from("images")
          .upload(`covers/${fileName}`, image);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(`covers/${fileName}`);

        imageUrl = publicUrlData.publicUrl;
      }

      // ✅ 2. Enregistrer dans Supabase
      const { data: supaData, error: supaError } = await supabase
        .from("texts")
        .insert([
          {
            title,
            type,
            excerpt,
            content,
            author_id: user.uid,
            author_name: user.displayName || "Auteur anonyme",
            image_url: imageUrl,
            views: 0,
            likes: 0,
            status: "Publié",
          },
        ])
        .select()
        .single();

      if (supaError) throw supaError;

      // ✅ 3. Sauvegarde Firestore (redondance / temps réel)
      await addDoc(collection(db, "texts"), {
        title,
        type,
        excerpt,
        content,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        imageUrl,
        createdAt: serverTimestamp(),
        views: 0,
        likes: 0,
        status: "Publié",
      });

      // ✅ 4. Synchroniser avec Google Sheets
      await sendToSheets({
        title,
        author: user.displayName || "Auteur anonyme",
        type,
        date: new Date().toISOString(),
        views: 0,
        likes: 0,
      });

      toast.success("🎉 Texte publié avec succès !");
      setTitle("");
      setExcerpt("");
      setContent("");
      setImage(null);
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      toast.error("❌ Échec de la publication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-white border rounded-lg shadow-sm p-6 space-y-4 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-semibold text-center mb-2">
        ✍️ Publier un texte
      </h2>

      {/* Champ titre */}
      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-md p-2"
          placeholder="Titre du texte"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1">Type de texte</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border rounded-md p-2"
        >
          <option>Roman</option>
          <option>Nouvelle</option>
          <option>Poésie</option>
          <option>Essai</option>
          <option>Article</option>
        </select>
      </div>

      {/* Extrait */}
      <div>
        <label className="block text-sm font-medium mb-1">Extrait</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows="2"
          className="w-full border rounded-md p-2"
          placeholder="Résumé ou introduction..."
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Contenu principal
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="8"
          className="w-full border rounded-md p-2"
          placeholder="Écrivez ou collez votre texte ici..."
          required
        />
      </div>

      {/* Image de couverture */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Image de couverture (facultative)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full border rounded-md p-2"
        />
      </div>

      {/* Bouton publier */}
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Publication en cours..." : "Publier le texte"}
        </Button>
      </div>
    </form>
  );
}