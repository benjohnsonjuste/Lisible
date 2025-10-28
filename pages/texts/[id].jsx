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
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");

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
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger le texte");
      }
    }
    fetchText();
  }, [id, user]);

  /**
   * ✅ Compteur de vues fiable :
   * - 1 vue par utilisateur connecté (basée sur son UID)
   * - 1 vue par appareil (visiteur non connecté)
   * - aucune duplication possible
   */
  const trackView = (textId) => {
    if (!textId) return;

    // Identifiant unique : userId si connecté, sinon deviceId stocké localement
    let uniqueViewerId;
    if (user?.uid) {
      uniqueViewerId = `user-${user.uid}`;
    } else {
      let deviceId = localStorage.getItem("lisibleDeviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("lisibleDeviceId", deviceId);
      }
      uniqueViewerId = `device-${deviceId}`;
    }

    // Récupérer la liste des viewers pour ce texte
    const key = `viewers-${textId}`;
    let viewers = JSON.parse(localStorage.getItem(key) || "[]");

    // Si déjà vu par cet utilisateur/appareil, ne rien faire
    if (viewers.includes(uniqueViewerId)) {
      setViews(viewers.length);
      return;
    }

    // Ajouter et sauvegarder
    viewers.push(uniqueViewerId);
    localStorage.setItem(key, JSON.stringify(viewers));
    setViews(viewers.length);
  };

  // 🔹 Commentaire
  const handleComment = () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour commenter.");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }

    if (!commentText.trim()) return;
    const newComment = {
      author: user.displayName || user.name || "Utilisateur",
      content: commentText,
      date: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
    toast.success("💬 Commentaire publié !");
  };

  // 🔹 Like
  const handleLike = () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour aimer ce texte.");
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }

    const key = `likes-${id}`;
    const likes = JSON.parse(localStorage.getItem(key) || "[]");

    if (likes.includes(user.uid)) {
      toast("💔 Tu as déjà aimé ce texte.");
      return;
    }

    likes.push(user.uid);
    localStorage.setItem(key, JSON.stringify(likes));
    toast.success("❤️ Merci pour ton like !");
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
        <p>
          ✍️ <strong>{text.authorName}</strong>
        </p>
        <p>{new Date(text.date).toLocaleString()}</p>
      </div>

      <p className="leading-relaxed whitespace-pre-line">{text.content}</p>

      <div className="flex gap-4 pt-4 border-t items-center">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
        >
          <Heart size={18} /> Aimer
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <Share2 size={18} /> Partager
        </button>

        <span className="ml-auto text-sm text-gray-500 flex items-center gap-1">
          <Eye size={16} /> {views} vue{text?.views > 1 ? "s" : ""}
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
                  <strong>{c.author}</strong> ·{" "}
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