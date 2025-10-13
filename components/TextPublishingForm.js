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
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("❌ Vous devez être connecté pour publier un texte.");
      return;
    }

    setLoading(true);
    toast.info("⏳ Publication du texte en cours...");

    const createdAt = new Date();
    const commitId = crypto.randomUUID();

    const syncStatus: Record<string, { success: boolean; message: string }> = {
      firestore: { success: false, message: "" },
      supabase: { success: false, message: "" },
      sheets: { success: false, message: "" },
    };

    try {
      const textData = {
        commitId,
        title,
        type,
        excerpt,
        content,
        authorId: user.uid,
        authorName: user.displayName || "Auteur anonyme",
        createdAt: createdAt.toISOString(),
        views: 0,
        likes: 0,
        status: "Publié",
        visibility: "public",
      };

      // 1️⃣ Firestore
      await addDoc(collection(db, "texts"), {
        ...textData,
        createdAt: serverTimestamp(),
        syncStatus,
      });
      syncStatus.firestore = { success: true, message: "Texte enregistré sur Firestore" };
      toast.success("✅ Firestore OK");

      // 2️⃣ Supabase
      const { error: supabaseError } = await supabase.from("texts").insert([textData]);
      if (supabaseError) {
        syncStatus.supabase = { success: false, message: supabaseError.message };
        throw new Error(`Supabase: ${supabaseError.message}`);
      }
      syncStatus.supabase = { success: true, message: "Texte ajouté dans Supabase" };
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
      syncStatus.sheets = { success: true, message: "Texte synchronisé avec Google Sheets" };
      toast.success("✅ Sheets OK");

      // ✅ Réinitialisation
      setTitle("");
      setExcerpt("");
      setContent("");

      toast.message("🎉 Publication réussie sur toutes les plateformes !");
    } catch (error: any) {
      console.error("Erreur lors de la publication :", error);
      toast.error(`❌ Échec : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handlePublish}
      className="bg-card border rounded-lg shadow-sm p-6 space-y-4"
    >
      {/* ...form fields inchangés... */}
      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Publication..." : "Publier le texte"}
        </Button>
      </div>
    </form>
  );
}