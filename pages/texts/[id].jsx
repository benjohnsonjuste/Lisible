// /pages/texts/[id].js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import TextActions from "@/components/TextActions";
import CommentSection from "@/components/CommentSection";
import { useUserProfile } from "@/hooks/useUserProfile"; // optional hook

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: userLoading } = (typeof useUserProfile === "function" ? useUserProfile() : { user: null, isLoading: false });

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch initial text file from public data (fast) — fallback to repo if not present
  useEffect(() => {
    if (!id) return;
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        // ensure fields
        data.likes = data.likes || [];
        data.comments = data.comments || [];
        data.views = data.views || 0;
        setText(data);

        // track view (client only) and persist to GitHub via API
        await trackViewAndSave(id, data);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [id, user]);

  const ensureDeviceId = () => {
    let dev = localStorage.getItem("deviceId");
    if (!dev) {
      dev = crypto.randomUUID();
      localStorage.setItem("deviceId", dev);
    }
    return dev;
  };

  const trackViewAndSave = async (textId, currentData) => {
    const key = `viewers-${textId}`;
    const viewers = JSON.parse(localStorage.getItem(key) || "[]");
    const myId = user?.uid || ensureDeviceId();

    if (!viewers.includes(myId)) {
      const updatedViewers = [...viewers, myId];
      localStorage.setItem(key, JSON.stringify(updatedViewers));
      const newViews = updatedViewers.length;

      // update local state and persist on GitHub
      setText((prev) => ({ ...prev, views: newViews }));
      try {
        await fetch("/api/github-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: textId, updatedFields: { views: newViews } }),
        });
      } catch (err) {
        console.error("Erreur sauvegarde vues :", err);
      }
    } else {
      setText((prev) => ({ ...prev, views: viewers.length }));
    }
  };

  if (loading || userLoading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded-xl" />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>

      <div className="text-gray-600 text-sm flex justify-between">
        <p>✍️ <strong>{text.authorName || text.author?.displayName || text.author?.email || "Auteur inconnu"}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* Actions: Like / Share / Views */}
      <TextActions id={id} initialLikes={text.likes || []} initialViews={text.views || 0} />

      {/* Comments */}
      <div className="pt-4 border-t">
        <CommentSection id={id} initialComments={text.comments || []} />
      </div>
    </div>
  );
}