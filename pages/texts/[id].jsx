"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const { user, isLoading: userLoading, redirectToAuth } = useUserProfile();

  const getDisplayName = (author) =>
    author.displayName || author.name || author.email || "Utilisateur";

  // 🔹 Enregistrer les données sur GitHub
  const saveToGitHub = async (updatedData) => {
    try {
      const res = await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data: updatedData }),
      });
      if (!res.ok) throw new Error("Erreur GitHub");
      console.log("✅ Données sauvegardées sur GitHub !");
    } catch (err) {
      console.error("❌ Sauvegarde GitHub échouée:", err);
    }
  };

  useEffect(() => {
    if (!id) return;
    async function fetchText() {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        trackView(data);
        setLoading(false);
      } catch {
        toast.error("Impossible de charger le texte");
      }
    }
    fetchText();
  }, [id]);

  const trackView = async (currentText) => {
    const key = `viewers-${id}`;
    const uniqueId = user?.uid || localStorage.getItem("deviceId") || crypto.randomUUID();
    localStorage.setItem("deviceId", uniqueId);

    const viewers = JSON.parse(localStorage.getItem(key) || "[]");
    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));
      setViews(viewers.length);

      const updated = { ...currentText, views: viewers.length };
      setText(updated);
      await saveToGitHub(updated);
    } else {
      setViews(viewers.length);
    }
  };

  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);

    const key = `likes-${id}`;
    let currentLikes = JSON.parse(localStorage.getItem(key) || "[]");
    const likeId = user.uid;
    if (currentLikes.includes(likeId)) return;

    currentLikes.push(likeId);
    localStorage.setItem(key, JSON.stringify(currentLikes));
    setLikes(currentLikes.length);
    setLiked(true);
    toast.success("Merci pour ton like !");

    const updated = { ...text, likes: currentLikes.length };
    setText(updated);
    await saveToGitHub(updated);
  };

  const handleComment = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);
    if (!commentText.trim()) return;

    const newComment = {
      author: getDisplayName(user),
      content: commentText,
      date: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setCommentText("");
    toast.success("Commentaire publié !");

    const updated = { ...text, comments: updatedComments };
    setText(updated);
    await saveToGitHub(updated);
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
        <p><strong>{getDisplayName(text.author)}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      <div className="flex gap-4 pt-4 border-t items-center">
        <button onClick={handleLike} className="flex items-center gap-2 transition">
          <Heart
            size={24}
            className={liked ? "text-pink-500" : "text-gray-400"}
            fill={liked ? "currentColor" : "none"}
          />
          <span>{likes}</span>
        </button>

        <button onClick={() => navigator.share({ title: text.title, url: window.location.href })}>
          <Share2 size={24} />
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Commentaires ({comments.length})</h3>
        {comments.map((c, i) => (
          <div key={i} className="p-2 border rounded mb-2">
            <p className="text-sm text-gray-700">
              <strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}
            </p>
            <p>{c.content}</p>
          </div>
        ))}

        <div className="mt-3 flex flex-col gap-2">
          <textarea
            placeholder="Écrire un commentaire..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleComment}
            className="self-end px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}