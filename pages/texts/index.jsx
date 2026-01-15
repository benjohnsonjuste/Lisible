"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function TextsPage() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "texts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setTexts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque</h1>

      <div className="grid gap-4">
        {texts.map(t => (
          <div key={t.id} className="border p-4 rounded">
            <h2 className="font-semibold text-lg">{t.title}</h2>
            <p className="text-sm text-gray-500">
              {t.authorName} • {t.createdAt?.toDate?.().toLocaleDateString()}
            </p>

            <div className="text-xs text-gray-400 mt-2 flex gap-4">
              <span>👁 {t.views}</span>
              <span>❤️ {t.likesCount}</span>
              <span>💬 {t.commentsCount}</span>
            </div>

            <Link
              href={`/texts/${t.id}`}
              className="inline-block mt-3 text-blue-600"
            >
              Lire →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
