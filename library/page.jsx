"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Image from "next/image";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTexts = async () => {
      const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTexts(data);
      setLoading(false);
    };

    loadTexts();
  }, []);

  if (loading)
    return <p className="text-center mt-10">Chargement des textes...</p>;

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">📚 Bibliothèque Lisible</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.map((text) => (
          <div
            key={text.id}
            className="border rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {text.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={text.imageUrl}
                  alt={text.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="p-4">
              <h2 className="text-lg font-semibold mb-1">{text.title}</h2>
              <p className="text-gray-600 text-sm line-clamp-3 mb-2">
                {text.excerpt}
              </p>
              <button
                className="text-blue-600 underline text-sm"
                onClick={() => alert(text.content)}
              >
                Lire plus
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
