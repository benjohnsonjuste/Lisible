"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

export default function BibliothequeText() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      const docRef = doc(db, "bibliotheque", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setText({ id: snap.id, ...snap.data() });

        // 🔹 Incrémenter le nombre de vues à chaque ouverture
        await updateDoc(docRef, { views: increment(1) });
      }
    };

    fetchText();
  }, [id]);

  if (!text) return <p className="text-center">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-gray-500">par {text.authorName || "Anonyme"}</p>
      <p className="mt-4">{text.content}</p>
      <p className="mt-4 text-sm text-gray-400">👁️ {text.views || 0} vues</p>
    </div>
  );
}