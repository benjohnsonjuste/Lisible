"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";

export default function TextPage({ user }) {
  const { id } = useParams();
  const router = useRouter();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);

  // Charger le texte depuis JSON
  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();

        if ((!data.authorName || data.authorName === "Auteur inconnu") && user?.email) {
          data.authorName = user.email.split("@")[0];
        }

        setText(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchText();
  }, [id, user]);

  // Gestion vues, likes et commentaires en temps réel
  useEffect(() => {
    if (!id) return;

    const metaRef = doc(db, "textsMeta", id);

    const registerView = async () => {
      if (!user?.uid) return;
      const docSnap = await getDoc(metaRef);
      const data = docSnap.data();
      const viewsByUser = data?.viewsByUser || {};
      if (!viewsByUser[user.uid]) {
        await setDoc(
          metaRef,
          {
            views: increment(1),
            [`viewsByUser.${user.uid}`]: true,
          },
          { merge: true }
        );
      }
    };

    const registerLikeStatus = async () => {
      if (!user?.uid) return;
      const docSnap = await getDoc(metaRef);
      const data = docSnap.data();
      const likesByUser = data?.likesByUser || {};
      setLiked(!!likesByUser[user.uid]);
    };

    registerView();
    registerLikeStatus();

    const unsubscribe = onSnapshot(metaRef, (snap) => {
      const data = snap.data();
      setViews(data?.views || 0);
      setLikes(data?.likes || 0);
    });

    const commentsRef = collection(db, "textsMeta", id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const unsubscribeComments = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubscribe();
      unsubscribeComments();
    };
  }, [id, user]);

  // Rediriger vers login si non connecté
  const requireAuth = () => {
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleLike = async () => {
    if (!user?.uid) return requireAuth();
    const metaRef = doc(db, "textsMeta", id);
    const docSnap = await getDoc(metaRef);
    const data = docSnap.data();
    const likesByUser = data?.likesByUser || {};

    if (!likesByUser[user.uid]) {
      await setDoc(
        metaRef,
        {
          likes: increment(1),
          [`likesByUser.${user.uid}`]: true,
        },
        { merge: true }
      );
      setLiked(true);
    }
  };

  const handleComment = async () => {
    if (!user?.uid) return requireAuth();
    if (!commentText.trim()) return;

    const commentsRef = collection(db, "textsMeta", id, "comments");
    await addDoc(commentsRef, {
      text: commentText.trim(),
      authorName: user.email.split("@")[0],
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Lien copié !");
    } catch (err) {
      console.error(err);
      alert("Impossible de copier le lien");
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!text) return <div className="text-center py-10">Aucun texte trouvé.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded" />
      )}
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500">
        ✍️ {text.authorName || "Auteur inconnu"} | 🗓 {new Date(text.date).toLocaleDateString("fr-FR")}
      </p>

      <div className="mt-4 whitespace-pre-line">{text.content}</div>

      <div className="flex gap-4 mt-6 text-gray-600">
        <span>👁️ {views}</span>
        <span>👍 {likes}</span>
        <span>💬 {comments.length}</span>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleLike}
          className={`px-3 py-1 rounded text-white ${
            liked ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {liked ? "Liked" : "Like"}
        </button>
        <button
          onClick={handleShare}
          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Partager
        </button>
      </div>

      <div className="mt-4">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded mb-2"
          placeholder="Écrire un commentaire..."
        />
        <button
          onClick={handleComment}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Commenter
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {comments.map((c, idx) => (
          <div key={idx} className="p-2 bg-gray-100 rounded">
            <span className="font-semibold">{c.authorName}:</span> {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}