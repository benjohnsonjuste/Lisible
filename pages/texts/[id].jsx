"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);

  // Charger la session utilisateur (exemple : localStorage ou Firebase)
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
        setLoading(false);
        trackView(id);
        trackLikes(id);
        trackComments(id);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger le texte");
      }
    }
    fetchText();
  }, [id, user]);

  // Vues fiables
  const trackView = (textId) => {
    let uniqueViewerId = user?.uid || localStorage.getItem("deviceId");
    if (!uniqueViewerId) {
      uniqueViewerId = crypto.randomUUID();
      localStorage.setItem("deviceId", uniqueViewerId);
    }

    const key = `viewers-${textId}`;
    let viewers = JSON.parse(localStorage.getItem(key) || "[]");

    if (!viewers.includes(uniqueViewerId)) {
      viewers.push(uniqueViewerId);
      localStorage.setItem(key, JSON.stringify(viewers));
    }
    setViews(viewers.length);
  };

  // Likes
  const trackLikes = (textId) => {
    const key = `likes-${textId}`;
    const currentLikes = JSON.parse(localStorage.getItem(key) || "[]");
    setLikes(currentLikes.length);

    const likeId = user?.uid || localStorage.getItem("deviceId");
    if (currentLikes.includes(likeId)) setLiked(true);
  };

  const handleLike = () => {
    const key = `likes-${id}`;
    const currentLikes = JSON.parse(localStorage.getItem(key) || "[]");

    let likeId = user?.uid || localStorage.getItem("deviceId");
    if (!likeId) {
      likeId = crypto.randomUUID();
      localStorage.setItem("deviceId", likeId);
    }

    if (currentLikes.includes(likeId)) return;

    const updatedLikes = [...currentLikes, likeId];
    localStorage.setItem(key, JSON.stringify(updatedLikes));
    setLikes(updatedLikes.length);
    setLiked(true);
    toast.success("❤️ Merci pour ton like !");
  };

  // Commentaires
  const trackComments = (textId) => {
    const key = `comments-${textId}`;
    const storedComments = JSON.parse(localStorage.getItem(key) || "[]");
    setComments(storedComments);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;

    const key = `comments-${id}`;
    const newComment = {
      author: user?.displayName || user?.name || "Utilisateur",
      content: commentText,
      date: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    localStorage.setItem(key, JSON.stringify(updatedComments));
    setComments(updatedComments);
    setCommentText("");
    toast.success("💬 Commentaire publié !");
  };

  // Partage
  const handleShare = async () => {
    try {
      await navigator.share({
        title: text?.title,
        text: `Découvre ce texte sur Lisible : ${text?.title}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("🔗 Lien copié dans le presse-papier !");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
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
        <p>✍️ <strong>{text.authorName}</strong></p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      <div className="flex gap-4 pt-4 border-t items-center">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex items-center gap-2 px-3 py-1 rounded transition ${
            liked ? "bg-pink-500 text-white cursor-default" : "bg-transparent text-pink-500 hover:bg-pink-100"
          }`}
        >
          <Heart size={18} />
          {likes}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <Share2 size={18} /> Partager
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">💬 Commentaires ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun commentaire pour l’instant.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="p-2 border rounded">
                <p className="text-sm text-gray-700">
                  <strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}
                </p>
                <p>{c.content}</p>
              </li>
            ))}
          </ul>
        )}

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