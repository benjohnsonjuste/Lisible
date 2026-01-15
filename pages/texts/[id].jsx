"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  doc, getDoc, updateDoc, increment,
  collection, addDoc, onSnapshot, serverTimestamp
} from "firebase/firestore";

export default function TextPage() {
  const { query } = useRouter();
  const { id } = query;

  const [text, setText] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "texts", id);

    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setText(snap.data());
        updateDoc(ref, { views: increment(1) });
      }
    });

    return onSnapshot(
      collection(db, "texts", id, "comments"),
      snap => {
        setComments(snap.docs.map(d => d.data()));
      }
    );
  }, [id]);

  const addComment = async () => {
    if (!user || !message) return;

    await addDoc(collection(db, "texts", id, "comments"), {
      authorId: user.uid,
      authorName: user.displayName || user.email,
      message,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "texts", id), {
      commentsCount: increment(1)
    });

    setMessage("");
  };

  if (!text) return <p className="p-6">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {text.authorName}
      </p>

      {text.imageUrl && (
        <img src={text.imageUrl} className="mb-4 rounded" />
      )}

      <p className="whitespace-pre-line mb-6">{text.content}</p>

      <hr />

      <h2 className="font-semibold mt-6">Commentaires</h2>

      <div className="space-y-2 mt-3">
        {comments.map((c, i) => (
          <div key={i} className="border p-2 rounded">
            <div className="text-xs text-gray-500">{c.authorName}</div>
            <div>{c.message}</div>
          </div>
        ))}
      </div>

      {user && (
        <div className="mt-4 flex gap-2">
          <input
            className="border flex-1 p-2"
            placeholder="Ajouter un commentaire"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={addComment} className="bg-black text-white px-3">
            Envoyer
          </button>
        </div>
      )}
    </div>
  );
}
