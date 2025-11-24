"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    user: currentUser,
    isLoading: userLoading,
    redirectToAuth,
  } = useUserProfile();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const [views, setViews] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  //---------------------------------------
  // 🔥 CHARGEMENT DU TEXTE
  //---------------------------------------
  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);

        if (!res.ok) throw new Error("Texte introuvable");

        const data = await res.json();

        // localStorage
        const storedLikes = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
        const storedComments = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");

        setText({
          ...data,
          likes: storedLikes,
          comments: storedComments,
        });

        setLikes(storedLikes.length);
        setLiked(currentUser ? storedLikes.includes(currentUser.uid) : false);
        setComments(storedComments);

        await trackView(data);

      } catch (err) {
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id, currentUser]);

  //---------------------------------------
  // 🔥 VUES UNIQUES
  //---------------------------------------
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
    const uniqueId = currentUser?.uid || ensureDeviceId();

    const viewers = JSON.parse(localStorage.getItem(key) || "[]");

    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));

      setViews(viewers.length);

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

  //---------------------------------------
  // ❤️ LIKE
  //---------------------------------------
  const handleLike = async () => {
    if (!currentUser) return redirectToAuth(`/texts/${id}`);

    const key = `likes-${id}`;
    let currentLikes = JSON.parse(localStorage.getItem(key) || "[]");

    if (currentLikes.includes(currentUser.uid)) {
      toast.info("Tu as déjà liké !");
      return;
    }

    currentLikes.push(currentUser.uid);
    localStorage.setItem(key, JSON.stringify(currentLikes));

    setLikes(currentLikes.length);
    setLiked(true);

    const updated = { ...text, likes: currentLikes };
    setText(updated);

    try {
      await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedFields: { likes: currentLikes } }),
      });
    } catch (err) {
      console.error("Erreur likes :", err);
    }

    toast.success("Merci pour ton like !");
  };

  //---------------------------------------
  // 💬 COMMENTAIRES
  //---------------------------------------
  const handleAddComment = async () => {
    if (!currentUser) return redirectToAuth(`/texts/${id}`);
    if (!newComment.trim()) return;

    const comment = {
      author:
        currentUser?.fullName ||
        currentUser?.displayName ||
        currentUser?.name ||
        "Utilisateur",
      content: newComment.trim(),
      date: new Date().toISOString(),
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment("");

    localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));

    const updatedText = { ...text, comments: updatedComments };
    setText(updatedText);

    try {
      await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedFields: { comments: updatedComments } }),
      });
    } catch (err) {
      console.error("Erreur commentaires :", err);
    }
  };

  //---------------------------------------
  // RENDU
  //---------------------------------------
  if (loading || userLoading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">

      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-64 object-cover rounded-xl"
        />
      )}

      <h1 className="text-3xl font-bold">{text.title}</h1>

      <div className="text-gray-600 text-sm flex justify-between">
        {/* 🔥 ❗ AFFICHE LE VRAI AUTEUR DU TEXTE ❗ */}
        <p>
          ✍️ <strong>{text.authorName || "Auteur inconnu"}</strong>
        </p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      {/* Actions */}
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
            navigator.share({ title: text.title, url: window.location.href })
          }
        >
          <Share2 size={24} />
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      {/* Commentaires */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-2">
          Commentaires ({comments.length})
        </h3>

        <ul className="space-y-2 mb-4">
          {comments.map((c, i) => (
            <li key={i} className="p-2 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">
                {c.author} • {new Date(c.date).toLocaleString()}
              </p>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          placeholder="Ajouter un commentaire..."
          className="w-full p-2 border rounded mb-2"
        />

        <button
          type="button"
          onClick={handleAddComment}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Commenter
        </button>
      </div>

    </div>
  );
}