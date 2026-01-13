"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import TextCard from "@/components/TextCard";

export default function Home() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      setTexts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 grid gap-4">
      {texts.map(t => <TextCard key={t.id} text={t} />)}
    </div>
  );
}