// /components/TextActions.js
"use client";

import { useEffect, useState } from "react";
import { Heart, Share2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile"; // si tu as ce hook ; sinon il retournera undefined

export default function TextActions({ id, initialLikes = [], initialViews = 0 }) {
  const { user, isLoading: userLoading, redirectToAuth } = (typeof useUserProfile === "function" ? useUserProfile() : { user: null, isLoading: false, redirectToAuth: (r)=>{ window.location.href = `/login?redirect=${r}` } });
  const [views, setViews] = useState(initialViews || 0);
  const [likes, setLikes] = useState(Array.isArray(initialLikes) ? initialLikes : []);
  const [liked, setLiked] = useState(false);

  // init from localStorage
  useEffect(() => {
    const viewers = JSON.parse(localStorage.getItem(`viewers-${id}`) || "[]");
    setViews(viewers.length);

    const storedLikes = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
    setLikes(storedLikes);
    const myId = user?.uid || localStorage.getItem("deviceId");
    if (myId && storedLikes.includes(myId)) setLiked(true);
  }, [id, user]);

  const ensureDeviceId = () => {
    let dev = localStorage.getItem("deviceId");
    if (!dev) {
      dev = crypto.randomUUID();
      localStorage.setItem("deviceId", dev);
    }
    return dev;
  };

  const handleLike = async (e) => {
    e?.preventDefault?.();
    if (!user) {
      // allow like for anonymous? earlier you said non-logged users can like but sometimes required login
      // here we will allow anonymous like but store by device; if you want force login, uncomment redirect
      // return redirectToAuth(`/texts/${id}`);
    }

    const key = `likes-${id}`;
    const storedLikes = JSON.parse(localStorage.getItem(key) || "[]");
    const likeId = user?.uid || ensureDeviceId();

    if (storedLikes.includes(likeId)) {
      toast.info("Tu as déjà aimé.");
      setLiked(true);
      return;
    }

    const updated = [...storedLikes, likeId];
    localStorage.setItem(key, JSON.stringify(updated));
    setLikes(updated);
    setLiked(true);
    toast.success("Merci pour ton like !");

    // Sauvegarde serveur -> GitHub
    try {
      await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedFields: { likes: updated } }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde like:", err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: document.title,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <button type="button" onClick={handleLike} className="flex items-center gap-2">
        <Heart size={20} className={liked ? "text-pink-500" : "text-gray-400"} fill={liked ? "currentColor" : "none"} />
        <span>{likes.length}</span>
      </button>

      <button type="button" onClick={handleShare} className="flex items-center gap-2 text-gray-600">
        <Share2 size={20} />
      </button>

      <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
        <Eye size={16} /> <span>{views}</span>
      </div>
    </div>
  );
}