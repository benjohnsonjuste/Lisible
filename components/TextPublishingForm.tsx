"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";
import { sendToSheets } from "@/lib/sendToSheets";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TextData {
  commitId: string;
  title: string;
  type: string;
  excerpt: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  views: number;
  likes: number;
  status: string;
  visibility: string;
}

export default function TextPublishingForm(): JSX.Element {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Roman");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !user.uid) {
      toast.error("❌ Vous devez être connecté pour publier un texte.");
      return;
    }

    setLoading(true);
    toast.info("⏳ Publication du texte en cours...");

    const createdAt = new Date().toISOString();
    const commitId = crypto.randomUUID();

    try {
      const textData: TextData = {
        commitId,
        title,
        type,
        excerpt,
        content,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        createdAt,
        views: 0,
        likes: 0,
        status: "Publié",
        visibility: "public",
      };

      // 1️⃣ Firestore
      await addDoc(collection(db, "texts"), {
        ...textData,
        createdAt: serverTimestamp(),
      });
      toast.success("✅ Firestore OK");

      // 2️⃣ Supabase
      const { error: supabaseError } = await supabase.from("texts").insert([textData]);
      if (supabaseError) throw new Error(`Supabase: ${supabaseError.message}`);
      toast.success("✅ Supabase OK");

      // 3️⃣ Google Sheets
      await sendToSheets({
        commitId,
        title: textData.title,
        author: textData.authorName,
        type: textData.type,
        excerpt: textData.excerpt,
        date: textData.createdAt,
        views: textData.views,
        likes: textData.likes,
        status: textData.status,
      });
      toast.success("✅ Sheets OK");

      // ✅ Réinitialisation
      setTitle("");
      setExcerpt("");
      setContent("");

      toast.success("🎉 Publication réussie sur toutes les plateformes !");
    } catch (error: any) {
      console.error("Erreur lors de la publication :", error);
      toast.error(`❌ Échec : ${error.message || error.toString()}`);
    } finally {
      setLoading(false);
    }
  }; // <-- ✅ bien fermer la fonction ici AVANT le return

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
          rows={2}
          className="w-full border rounded-md p-2"
          placeholder="Résumé ou introduction..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu principal</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
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