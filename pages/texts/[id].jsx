"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  doc, getDoc, updateDoc, increment, arrayUnion
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import LikeButton from "@/components/LikeButton";
import CommentForm from "@/components/CommentForm";
import CommentList from "@/components/CommentList";

export default function TextPage() {
  const { query } = useRouter();
  const { id } = query;
  const [text, setText] = useState(null);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "texts", id);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        setText({ id: snap.id, ...snap.data() });
        updateDoc(ref, { views: increment(1) });
      }
    });
  }, [id]);

  if (!text) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{text.title}</h1>
      <p className="text-gray-500">{text.authorName}</p>

      {text.imageUrl && <img src={text.imageUrl} className="my-4 rounded" />}

      <p className="whitespace-pre-line">{text.content}</p>

      <LikeButton textId={id} likes={text.likes} />

      <CommentForm textId={id} />
      <CommentList textId={id} />
    </div>
  );
}