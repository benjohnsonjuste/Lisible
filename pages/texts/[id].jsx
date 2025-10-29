// pages/data/texts/[id].jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye, MessageSquare } from "lucide-react";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Charger session utilisateur
  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Charger le texte
  useEffect(() => {
    if (!id) return;
    async function fetchText() {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);

        const storedLikes = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
        const storedComments = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");
        const storedViews = JSON.parse(localStorage.getItem(`viewers-${id}`) || "[]");

        setLikes(storedLikes.length);
        setComments(storedComments);
        setViews(storedViews.length);

        trackView(id, storedViews);
      } catch (err) {
        console.error(err);
        toast.error("Erreur de chargement du texte.");
      }
    }
    fetchText();
  }, [id]);

  // Vue unique
  const trackView = async (textId, storedViews) => {
    let viewerId = user?.uid || localStorage.getItem("deviceId");
    if (!viewerId) {
      viewerId = crypto.randomUUID();
      localStorage.setItem("deviceId", viewerId);
    }

    if (storedViews.includes(viewerId)) return;

    const newViews = [...storedViews, viewerId];
    localStorage.setItem(`viewers-${textId}`, JSON.stringify(newViews));
    setViews(newViews.length);

    await updateStats(textId, newViews.length, likes, comments.length);
  };

  // Like
  const handleLike = async () => {
    if (!user) {
      toast.error("Connecte-toi pour aimer ce texte.");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }

    const key = `likes-${id}`;
    const currentLikes = JSON.parse(localStorage.getItem(key) || "[]");
    if (currentLikes.includes(user.uid)) return;

    const updatedLikes = [...currentLikes, user.uid];
    localStorage.setItem(key, JSON.stringify(updatedLikes));
    setLikes(updatedLikes.length);
    toast.success("❤️ Merci pour ton like !");

    await updateStats(id, views, updatedLikes.length, comments.length);
  };

  // Commentaire
  const handleComment = async () => {
    if (!user) {
      toast.error("Connecte-toi pour commenter.");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }

    if (!commentText.trim()) return;
    const newComment = {
      author: user.displayName || user.name || "Utilisateur",
      content: commentText,
      date: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
    setCommentText("");

    toast.success("💬 Commentaire ajouté !");
    await updateStats(id, views, likes, updatedComments.length);
  };

  // Synchroniser sur GitHub
  const updateStats = async (textId, views, likes, comments) => {
    try {
      await fetch("/api/update-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: Number(textId), views, likes, comments }),
      });
    } catch (err) {
      console.warn("⚠️ Erreur sync GitHub:", err.message);
    }
  };

  if (!text) return <p className="text-center mt-10">Chargement...</p>;

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
        <p>✍️ <strong>{text.authorName}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      <div className="flex gap-6 pt-4 border-t items-center text-gray-700">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 ${
            likes > 0 ? "text-pink-600" : "text-gray-400"
          }`}
          disabled={likes > 0}
        >
          <Heart size={20} />
          <span>{likes}</span>
        </button>

        <span className="flex items-center gap-1">
          <Eye size={18} /> {views}
        </span>

        <span className="flex items-center gap-1">
          <MessageSquare size={18} /> {comments.length}
        </span>

        <button
          onClick={async () => {
            try {
              await navigator.share({
                title: text.title,
                text: "Lis ce texte sur Lisible",
                url: window.location.href,
              });
            } catch {
              navigator.clipboard.writeText(window.location.href);
              toast.success("🔗 Lien copié !");
            }
          }}
          className="ml-auto text-blue-600 hover:underline"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Zone commentaires */}
      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">
          💬 Commentaires ({comments.length})
        </h3>

        {comments.map((c, i) => (
          <div key={i} className="border p-2 rounded mb-2">
            <p className="text-sm text-gray-700">
              <strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}
            </p>
            <p>{c.content}</p>
          </div>
        ))}

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Écris ton commentaire..."
          className="w-full border rounded p-2 mt-2"
        />
        <button
          onClick={handleComment}
          className="mt-2 bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Publier
        </button>
      </div>
    </div>
  );
}