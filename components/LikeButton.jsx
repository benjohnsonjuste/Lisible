// components/LikeButton.jsx
"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Heart } from "lucide-react";

export default function LikeButton({ textId }) {
  const [count, setCount] = useState(0);
  const docRef = doc(db, "likes", String(textId));

  useEffect(() => {
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) {
        setCount(0);
      } else {
        setCount(snap.data().count || 0);
      }
    }, (err) => console.error("like onSnapshot error", err));
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textId]);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { count: 1 });
      } else {
        await updateDoc(docRef, { count: increment(1) });
      }
    } catch (err) {
      console.error("like error", err);
    }
  };

  return (
    <button onClick={handleLike} className="flex items-center gap-2 text-sm">
      <Heart size={16} /> {count}
    </button>
  );
}