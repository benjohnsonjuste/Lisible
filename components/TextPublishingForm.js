"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";
import { sendToSheets } from "@/lib/sendToSheets";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner"; // ✅ pour afficher des popups jolis

export default function TextPublishingForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Fonction pour publier le texte sur Firestore + Supabase + Google Sheets
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("❌ Vous devez être connecté pour publier un texte.");
      return;
    }

    setLoading(true);
    toast.info("⏳ Publication du texte en cours...");

    try {
      const textData = {
        title,
        type,
        excerpt,
        content,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        status: "Publié",
        visibility: "public",
      };

      // 1️⃣ Envoi dans Firestore
      await addDoc(collection(db, "texts"), {
        ...textData,
        createdAt: serverTimestamp(),
      });
      toast.success("✅ Texte enregistré sur Firestore !");

      // 2️⃣ Envoi dans Supabase
      const { error: supabaseError } = await supabase.from("texts").insert([textData]);
      if (supabaseError) throw new Error(supabaseError.message);
      toast.success("✅ Texte ajouté dans Supabase !");

      // 3️⃣ Envoi dans Google Sheets
      await sendToSheets({
        title: textData.title,
        author: textData.authorName,
        type: textData.type,
        excerpt: textData.excerpt,
        date: textData.createdAt,
        views: textData.views,
        likes: textData.likes,
        status: textData.status,
      });
      toast.success("✅ Texte synchronisé avec Google Sheets !");

      // ✅ Réinitialisation du formulaire
      setTitle("");
      setExcerpt("");
      setContent("");

      toast.message("🎉 Publication complète sur toutes les plateformes !");
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      toast.error(`❌ Échec de la publication : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-card border rounded-lg shadow-sm p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Titre du texte</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-md p-2"
          placeholder="Ex: Le Chant du Vent"
        />
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-1">Contenu principal</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="8"
          className="w-full border rounded-md p-2"
          placeholder="Écrivez ou collez votre texte ici..."
          required
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Publication..." : "Publier le texte"}
        </Button>
      </div>
    </form>
  );
}