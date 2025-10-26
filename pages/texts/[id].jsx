"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/firebase"; // firebase initialisé
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function TextPage() {
  const params = useParams();
  const textId = params.id;

  const [text, setText] = useState(null);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    async function fetchText() {
      const res = await fetch(`/data/texts/${textId}.json`);
      const data = await res.json();
      setText(data);
    }

    fetchText();

    // Gestion vues Firestore
    const viewRef = doc(db, "texts", textId);
    setDoc(viewRef, { views: increment(1) }, { merge: true });
    const unsubscribeViews = onSnapshot(viewRef, (snap) => {
      setViews(snap.data()?.views || 0);
      setLikes(snap.data()?.likes || 0);
    });

    // Gestion commentaires
    const commentsRef = collection(db, "texts", textId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsubscribeViews();
      unsubscribeComments();
    };
  }, [textId]);

  const handleLike = async () => {
    const textRef = doc(db, "texts", textId);
    await updateDoc(textRef, { likes: increment(1) });
  };

  const handleComment = async () => {
    if (!commentInput) return;
    const commentsRef = collection(db, "texts", textId, "comments");
    await addDoc(commentsRef, {
      text: commentInput,
      createdAt: new Date(),
    });
    setCommentInput("");
  };

  if (!text) return <div>Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-2">{text.title}</h1>
      <p className="text-sm mb-4">
        Auteur: <span className="font-semibold">{text.authorName}</span> | Vues: {views} | Likes: {likes}
      </p>
      {text.image && <img src={text.image.replace(".json", "")} alt={text.title} className="w-full h-64 object-cover rounded mb-4" />}
      <p className="whitespace-pre-line">{text.content}</p>

      <button
        onClick={handleLike}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        ❤️ Like
      </button>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Commentaires</h2>
        <div className="flex gap-2 mb-2">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Écrire un commentaire..."
          />
          <button onClick={handleComment} className="px-4 py-2 bg-blue-600 text-white rounded">
            Envoyer
          </button>
        </div>
        {comments.map((c, i) => (
          <p key={i} className="border-b py-1">{c.text}</p>
        ))}
      </div>
    </div>
  );
            }
