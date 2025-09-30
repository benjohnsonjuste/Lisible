"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function Library() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    // 🔹 Récupération en temps réel de tous les textes publiés
    const q = query(collection(db, "bibliotheque"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTexts(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Bibliothèque</h1>
      {texts.map((text) => (
        <div key={text.id} className="p-4 border rounded-lg shadow">
          <h2 className="text-xl font-bold">{text.title}</h2>
          <p className="text-gray-500">par {text.authorName || "Anonyme"}</p>
          <p className="text-gray-700 line-clamp-3">{text.content}</p>
          <Link
            href={`/bibliotheque/${text.id}`}
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Lire la suite
          </Link>
        </div>
      ))}
      {texts.length === 0 && (
        <p className="text-center text-gray-500">Aucune publication pour le moment.</p>
      )}
    </div>
  );
}