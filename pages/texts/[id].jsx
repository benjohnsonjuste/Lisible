"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { toast } from "sonner";
import Link from "next/link";

export default function TextPage({ user }) {
  const router = useRouter();
  const params = useParams();
  const textId = params?.id;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  // Charger le texte
  useEffect(() => {
    if (!textId) return;
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${textId}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger le texte");
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [textId]);

  // Mettre à jour compteur vues
  useEffect(() => {
    if (!textId) return;
    const metaRef = doc(db, "textsMeta", textId);
    onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
      setComments(data?.comments || []);
    });

    // Incrémenter les vues si utilisateur unique
    (async () => {
      const userId = user?.id || "anon";
      const userDoc = doc(db, "textsMeta", textId);
      await setDoc(
        userDoc,
        { viewers: arrayUnion(userId) },
        { merge: true }
      );
      const snap = await doc(db, "textsMeta", textId).get();
      const viewers = snap.data()?.viewers || [];
      if (!viewers.includes(userId)) {
        await updateDoc(doc(db, "textsMeta", textId), { views: increment(1) });
      }
    })();
  }, [textId, user]);

  const handleLike = async () => {
    if (!user) return router.push(`/login?redirect=/texts/${textId}`);
    try {
      const userLikeId = user.id;
      const metaRef = doc(db, "textsMeta", textId);
      const snap = await metaRef.get();
      const likedUsers = snap.data()?.likedUsers || [];
      if (likedUsers.includes(userLikeId)) {
        toast.error("Vous avez déjà liké ce texte");
        return;
      }
      await updateDoc(metaRef, {
        likes: increment(1),
        likedUsers: arrayUnion(userLikeId),
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du like");
    }
  };

  const handleComment = async () => {
    if (!user) return router.push(`/login?redirect=/texts/${textId}`);
    if (!commentText.trim()) return;
    try {
      const metaRef = doc(db, "textsMeta", textId);
      await updateDoc(metaRef, {
        comments: arrayUnion({
          userId: user.id,
          userName: user.name,
          text: commentText,
          createdAt: new Date().toISOString(),
        }),
      });
      setCommentText("");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-600">Chargement...</div>;
  if (!text) return <div className="text-center py-10 text-gray-600">Texte introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded" />
      )}
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        ✍️ {text.authorName} | 🗓 {new Date(text.date).toLocaleDateString("fr-FR")}
      </p>
      <p className="whitespace-pre-line">{text.content}</p>

      <div className="flex items-center gap-6 mt-4 text-gray-600">
        <button onClick={handleLike} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          👍 {likes}
        </button>
        <span>👁️ {views}</span>
        <button
          onClick={() => navigator.share?.({ title: text.title, url: window.location.href })}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          🔗 Partager
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">💬 Commentaires ({comments.length})</h2>
        {comments.map((c, i) => (
          <div key={i} className="mb-2 p-2 bg-gray-100 rounded">
            <span className="font-semibold">{c.userName}:</span> {c.text}
          </div>
        ))}

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="flex-1 p-2 border rounded"
          />
          <button onClick={handleComment} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}