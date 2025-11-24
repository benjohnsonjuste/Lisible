"use client";

import { useEffect, useState } from "react";
import { Heart, Share2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function TextActions({ id, text, onUpdate }) {
  const { user, redirectToAuth } = useUserProfile();

  const [likes, setLikes] = useState(text.likes.length);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(text.views);

  // Vérifier si déjà liké
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
    setLiked(user && stored.includes(user.uid));
    setLikes(stored.length);
  }, [user, id]);

  // Suivi des vues uniques
  useEffect(() => {
    const key = `views-${id}`;
    const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);

    const viewers = JSON.parse(localStorage.getItem(key) || "[]");

    if (!viewers.includes(deviceId)) {
      viewers.push(deviceId);
      localStorage.setItem(key, JSON.stringify(viewers));
      setViews(viewers.length);

      saveToGitHub({ ...text, views: viewers.length });
      onUpdate((prev) => ({ ...prev, views: viewers.length }));
    }
  }, [id]);

  const saveToGitHub = async (data) => {
    await fetch("/api/github-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data }),
    });
  };

  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);

    const key = `likes-${id}`;
    let stored = JSON.parse(localStorage.getItem(key) || "[]");

    if (stored.includes(user.uid)) return toast.info("Déjà liké");

    stored.push(user.uid);
    localStorage.setItem(key, JSON.stringify(stored));

    setLikes(stored.length);
    setLiked(true);

    const updated = { ...text, likes: stored };
    onUpdate(updated);
    saveToGitHub(updated);
  };

  return (
    <div className="flex gap-4 pt-4 border-t items-center">
      <button onClick={handleLike} className="flex items-center gap-2">
        <Heart
          size={24}
          className={liked ? "text-pink-500" : "text-gray-400"}
          fill={liked ? "currentColor" : "none"}
        />
        <span>{likes}</span>
      </button>

      <button
        onClick={() =>
          navigator.share?.({ title: text.title, url: window.location.href })
        }
      >
        <Share2 size={24} />
      </button>

      <span className="ml-auto text-gray-500 flex items-center gap-1">
        <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
      </span>
    </div>
  );
}