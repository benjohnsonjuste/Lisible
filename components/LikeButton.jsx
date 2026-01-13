"use client";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function LikeButton({ textId, likes }) {
  const uid = auth.currentUser?.uid;

  const liked = likes?.includes(uid);

  const like = async () => {
    if (!uid || liked) return;
    await updateDoc(doc(db, "texts", textId), {
      likes: arrayUnion(uid)
    });
  };

  return (
    <button onClick={like} className={`mt-4 ${liked ? "text-red-500" : ""}`}>
      ❤️ {likes?.length || 0}
    </button>
  );
}