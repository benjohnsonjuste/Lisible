"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import TextActions from "@/components/TextActions";
import CommentSection from "@/components/CommentSection";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const { user, isLoading: userLoading } = useUserProfile();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le texte
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");

        const data = await res.json();
        data.likes = data.likes || [];
        data.comments = data.comments || [];
        data.views = data.views || 0;

        setText(data);
      } catch {
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading || userLoading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && (
        <img src={text.image} className="w-full h-64 object-cover rounded-xl" />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>

      <div className="text-gray-600 text-sm flex justify-between">
        <p><strong>{text.authorName || "Auteur inconnu"}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* Actions */}
      <TextActions id={id} text={text} onUpdate={setText} />

      {/* Commentaires */}
      <CommentSection id={id} comments={text.comments} onUpdate={setText} />
    </div>
  );
}