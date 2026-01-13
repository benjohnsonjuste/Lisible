"use client";
import { auth, db } from "@/lib/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

export default function CommentForm({ textId }) {
  const [msg, setMsg] = useState("");

  const send = async () => {
    if (!msg || !auth.currentUser) return;
    await addDoc(collection(db, "texts", textId, "comments"), {
      message: msg,
      author: auth.currentUser.displayName,
      createdAt: serverTimestamp()
    });
    setMsg("");
  };

  return (
    <div className="mt-6">
      <textarea value={msg} onChange={e => setMsg(e.target.value)} />
      <button onClick={send}>Commenter</button>
    </div>
  );
}