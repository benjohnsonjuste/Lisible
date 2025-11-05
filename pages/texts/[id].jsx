"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

// 🔹 Enregistre les modifications sur GitHub
async function saveTextToGitHub(id, updatedData) {
  try {
    const res = await fetch("/api/update-text-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updatedData }),
    });
    if (!res.ok) throw new Error("Échec de la mise à jour sur GitHub");
    console.log("✅ Données enregistrées sur GitHub :", updatedData);
  } catch (error) {
    console.error("❌ Erreur GitHub :", error);
  }
}

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState([]); // [{uid, name}]
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);

  const { user, isLoading: userLoading, redirectToAuth } = useUserProfile();

  const getDisplayName = (author) =>
    author?.fullName ||
    author?.displayName ||
    author?.name ||
    author?.email ||
    "Utilisateur";

  // 🔹 Charger le texte
  useEffect(() => {
    if (!id) return;
    async function fetchText() {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        trackView(id, data);
        trackLikes(id, data);
        trackComments(id, data);
      } catch (error) {
        toast.error("Impossible de charger le texte");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchText();
  }, [id, user]);

  // 🔹 Vues uniques
  const trackView = async (textId, currentText) => {
    let uniqueId = user?.uid || localStorage.getItem("deviceId");
    if (!uniqueId) {
      uniqueId = crypto.randomUUID();
      localStorage.setItem("deviceId", uniqueId);
    }

    const key = `viewers-${textId}`;
    let viewers = JSON.parse(localStorage.getItem(key) || "[]");
    if (!viewers.includes(uniqueId)) {
      viewers.push(uniqueId);
      localStorage.setItem(key, JSON.stringify(viewers));
      const newViews = viewers.length;
      setViews(newViews);

      // 🔸 Enregistrer sur GitHub
      await saveTextToGitHub(textId, {
        ...currentText,
        views: newViews,
        updatedAt: new Date().toISOString(),
      });
    } else {
      setViews(viewers.length);
    }
  };

  // 🔹 Likes
  const trackLikes = (textId, currentText) => {
    const key = `likes-${textId}`;
    const storedLikes = JSON.parse(localStorage.getItem(key) || "[]");
    const formattedLikes = storedLikes.map((l) =>
      typeof l === "string" ? { uid: l, name: "Utilisateur" } : l
    );
    setLikes(formattedLikes);
    if (user && formattedLikes.some((l) => l.uid === user.uid)) setLiked(true);
  };

  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);
    const key = `likes-${id}`;
    let storedLikes = JSON.parse(localStorage.getItem(key) || "[]");
    storedLikes = storedLikes.map((l) =>
      typeof l === "string" ? { uid: l, name: "Utilisateur" } : l
    );

    if (storedLikes.some((l) => l.uid === user.uid)) return;

    const newLike = { uid: user.uid, name: getDisplayName(user) };
    const updatedLikes = [...storedLikes, newLike];
    localStorage.setItem(key, JSON.stringify(updatedLikes));
    setLikes(updatedLikes);
    setLiked(true);
    toast.success("Merci pour ton like !");

    // 🔸 Enregistrer sur GitHub
    await saveTextToGitHub(id, {
      ...text,
      likes: updatedLikes,
      updatedAt: new Date().toISOString(),
    });
  };

  // 🔹 Commentaires
  const trackComments = (textId, currentText) => {
    const key = `comments-${textId}`;
    const storedComments = JSON.parse(localStorage.getItem(key) || "[]");
    setComments(storedComments);
  };

  const handleComment = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);
    if (!commentText.trim()) return;

    const key = `comments-${id}`;
    const newComment = {
      author: { fullName: getDisplayName(user), uid: user.uid },
      content: commentText.trim(),
      date: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    localStorage.setItem(key, JSON.stringify(updatedComments));
    setComments(updatedComments);
    setCommentText("");
    toast.success("Commentaire publié !");

    // 🔸 Enregistrer sur GitHub
    await saveTextToGitHub(id, {
      ...text,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  // 🔹 Partage
  const handleShare = async () => {
    try {
      await navigator.share({
        title: text?.title,
        text: `Découvre ce texte sur Lisible : ${text?.title}`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Texte partagé !");
    }
  };

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
        <p>
          <strong>{getDisplayName(text.author)}</strong>
        </p>
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
          <span>{likes.length}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-600 transition"
        >
          <Share2 size={24} />
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{views > 1 ? "s" : ""}
        </span>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold mb-2">Commentaires ({comments.length})</h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun commentaire pour l’instant.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="p-2 border rounded">
                <p className="text-sm text-gray-700">
                  <strong>{getDisplayName(c.author)}</strong> ·{" "}
                  {new Date(c.date).toLocaleString()}
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