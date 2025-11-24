"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import CommentSection from "@/components/CommentSection";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isLoading: userLoading, redirectToAuth } =
    typeof useUserProfile === "function" ? useUserProfile() : { user: null, isLoading: false, redirectToAuth: () => {} };

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);

  // Charger le texte + initialiser likes & vues
  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();

        // Initialiser likes et comments depuis localStorage
        const storedLikes = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
        const storedComments = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");

        setText({ ...data, comments: storedComments, likes: storedLikes });
        setLikes(storedLikes.length);
        setLiked(user ? storedLikes.includes(user.uid) : false);

        // Track views
        await trackView(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger le texte");
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

  const trackView = async (currentText) => {
    const key = `viewers-${id}`;
    const uniqueId = user?.uid || ensureDeviceId();

    const viewers = JSON.parse(localStorage.getItem(key) || "[]");
    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));
      setViews(viewers.length);

      // Persister sur GitHub
      const updated = { ...currentText, views: viewers.length };
      setText(updated);
      try {
        await fetch("/api/github-save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, updatedFields: { views: viewers.length } }),
        });
      } catch (err) {
        console.error("Erreur sauvegarde vues :", err);
      }
    } else {
      setViews(viewers.length);
    }
  };

  // Gestion du like
  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);

    const key = `likes-${id}`;
    let currentLikes = JSON.parse(localStorage.getItem(key) || "[]");
    if (currentLikes.includes(user.uid)) {
      toast.info("Tu as déjà liké !");
      return;
    }

    currentLikes.push(user.uid);
    localStorage.setItem(key, JSON.stringify(currentLikes));
    setLikes(currentLikes.length);
    setLiked(true);
    toast.success("Merci pour ton like !");

    // Persister sur GitHub
    const updated = { ...text, likes: currentLikes };
    setText(updated);
    try {
      await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedFields: { likes: currentLikes } }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde likes :", err);
    }
  };

  if (loading || userLoading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable.</p>;

  const getDisplayName = (author) =>
    author?.displayName || author?.name || author?.email || "Utilisateur";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded-xl" />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>

      <div className="text-gray-600 text-sm flex justify-between">
        <p>✍️ <strong>{getDisplayName(text.author)}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* Actions: Like / Share / Views */}
      <div className="flex gap-4 pt-4 border-t items-center">
        <button onClick={handleLike} className="flex items-center gap-2 transition">
          <Heart size={24} className={liked ? "text-pink-500" : "text-gray-400"} fill={liked ? "currentColor" : "none"} />
          <span>{likes}</span>
        </button>

        <button onClick={() => navigator.share({ title: text.title, url: window.location.href })}>
          <Share2 size={24} />
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      {/* Comments */}
      <CommentSection textId={id} text={text} setText={setText} saveToGitHub={async (updated) => {
        try {
          await fetch("/api/github-save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, updatedFields: { comments: updated.comments } }),
          });
        } catch (err) {
          console.error("Erreur sauvegarde commentaires :", err);
        }
      }} />
    </div>
  );
}