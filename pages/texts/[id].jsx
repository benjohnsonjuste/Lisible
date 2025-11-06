"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Share2, Eye } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

async function saveTextToGitHub(id, updatedData) {
  try {
    const res = await fetch("/api/update-text-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updatedData }),
    });
    if (!res.ok) throw new Error("Échec de la mise à jour sur GitHub");
  } catch (error) {
    console.error("Erreur GitHub :", error);
  }
}

export default function TextPage() {
  const router = useRouter();
  const id = router?.query?.id || null;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState([]);
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

  // Charger le texte
  useEffect(() => {
    if (!id) return;
    async function fetchText() {
      try {
        const res = await fetch(`/api/texts/${id}`);
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
  }, [id]);

  // Gestion des vues
  const trackView = (id, data) => {
    const key = `views-${id}`;
    let storedViews = parseInt(localStorage.getItem(key) || "0");
    storedViews += 1;
    localStorage.setItem(key, storedViews);
    setViews(storedViews);
  };

  // Charger les likes et commentaires depuis localStorage
  const trackLikes = (id) => {
    const stored = JSON.parse(localStorage.getItem(`likes-${id}`) || "[]");
    setLikes(stored);
    if (user && stored.some((l) => l.uid === user.uid)) setLiked(true);
  };

  const trackComments = (id) => {
    const stored = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");
    setComments(stored);
  };

  // Gestion des likes
  const handleLike = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);
    const key = `likes-${id}`;
    let storedLikes = JSON.parse(localStorage.getItem(key) || "[]");

    if (storedLikes.some((l) => l.uid === user.uid)) return;

    const newLike = { uid: user.uid, name: getDisplayName(user) };
    const updatedLikes = [...storedLikes, newLike];
    localStorage.setItem(key, JSON.stringify(updatedLikes));
    setLikes((prev) => [...prev, newLike]);
    setLiked(true);
    toast.success("Merci pour ton like !");
    await saveTextToGitHub(id, { ...text, likes: updatedLikes });
  };

  // Gestion des commentaires
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
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
    toast.success("Commentaire publié !");
    await saveTextToGitHub(id, { ...text, comments: updatedComments });
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (!text) return <div className="text-center py-10">Texte introuvable.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{text.title}</h1>
      <p className="text-gray-700 mb-6 whitespace-pre-wrap">{text.content}</p>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 ${liked ? "text-red-500" : ""}`}
        >
          <Heart size={20} />
          <span>{likes.length}</span>
        </button>

        <div className="flex items-center gap-2 text-gray-500">
          <Eye size={20} />
          <span>{views}</span>
        </div>

        <button
          onClick={() => navigator.share?.({ title: text.title, url: window.location.href })}
          className="flex items-center gap-2 text-gray-500"
        >
          <Share2 size={20} />
          <span>Partager</span>
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Commentaires</h2>

        <div className="space-y-4 mb-4">
          {comments.length > 0 ? (
            comments.map((c, i) => (
              <div key={i} className="border p-3 rounded-md">
                <p className="font-medium">{c.author.fullName}</p>
                <p className="text-gray-700">{c.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Aucun commentaire pour le moment.</p>
          )}
        </div>

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full border rounded-md p-2 mb-3"
          placeholder="Écrire un commentaire..."
        ></textarea>

        <button
          onClick={handleComment}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Publier
        </button>
      </div>
    </div>
  );
}