"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/firebase"; // Assure-toi que db est exporté
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { useSession } from "next-auth/react";

export default function TextPage() {
  const router = useRouter();
  const params = useParams();
  const textId = params?.id;

  const { data: session } = useSession();
  const [text, setText] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${textId}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);

        // 🔹 Incrémente les vues si l'utilisateur est connecté
        const metaRef = doc(db, "textsMeta", textId);
        await updateDoc(metaRef, { views: increment(1) }).catch(() =>
          updateDoc(metaRef, { views: 1 })
        );

        // 🔹 Écoute en temps réel des vues, likes et commentaires
        onSnapshot(metaRef, (snap) => {
          const meta = snap.data();
          setViews(meta?.views || 0);
          setLikes(meta?.likes || 0);
          setComments(meta?.comments || []);
        });
      } catch (err) {
        console.error("Erreur chargement texte:", err);
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };

    if (textId) fetchText();
  }, [textId]);

  const handleLike = async () => {
    if (!session) {
      toast.error("Vous devez vous connecter pour liker");
      router.push(`/login?redirect=/texts/${textId}`);
      return;
    }

    try {
      const metaRef = doc(db, "textsMeta", textId);
      await updateDoc(metaRef, {
        likes: increment(1),
        likedBy: arrayUnion(session.user.email),
      });
    } catch (err) {
      console.error(err);
      toast.error("Impossible de liker pour le moment");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("Vous devez vous connecter pour commenter");
      router.push(`/login?redirect=/texts/${textId}`);
      return;
    }
    if (!newComment.trim()) return;

    try {
      const metaRef = doc(db, "textsMeta", textId);
      await updateDoc(metaRef, {
        comments: arrayUnion({
          text: newComment,
          author: session.user.name || session.user.email,
          date: new Date().toISOString(),
        }),
      });
      setNewComment("");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de commenter pour le moment");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: text.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers !");
    }
  };

  if (loading)
    return <div className="text-center py-10 text-gray-600">Chargement...</div>;

  if (!text)
    return (
      <div className="text-center py-10 text-gray-600">Texte introuvable.</div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500">
        ✍️ {text.authorName} | 🗓{" "}
        {new Date(text.date).toLocaleDateString("fr-FR")}
      </p>
      {text.image && (
        <img
          src={text.image}
          alt={text.title}
          className="w-full h-64 object-cover rounded"
        />
      )}
      <div className="prose">{text.content}</div>

      <div className="flex gap-4 items-center mt-4">
        <button
          onClick={handleLike}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          👍 {likes}
        </button>
        <span>👁️ {views}</span>
        <button
          onClick={handleShare}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          🔗 Partager
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">💬 Commentaires</h2>
        <form onSubmit={handleComment} className="flex flex-col gap-2 mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={3}
            className="w-full border p-2 rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Commenter
          </button>
        </form>

        {comments.length ? (
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="border p-2 rounded">
                <p className="text-sm text-gray-700">{c.text}</p>
                <p className="text-xs text-gray-500">
                  — {c.author} |{" "}
                  {new Date(c.date).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Aucun commentaire pour le moment.</p>
        )}
      </div>
    </div>
  );
}