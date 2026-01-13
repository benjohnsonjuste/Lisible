"use client";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useEffect, useState } from "react";

export default function CommentList({ textId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "texts", textId, "comments"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, snap =>
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [textId]);

  return (
    <div className="mt-4 space-y-2">
      {comments.map(c => (
        <div key={c.id} className="text-sm">
          <b>{c.author}</b> — {c.message}
        </div>
      ))}
    </div>
  );
}