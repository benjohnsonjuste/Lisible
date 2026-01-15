"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TextsPage() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    fetch("/api/texts")
      .then(res => res.json())
      .then(data => setTexts(data));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold mb-4">Bibliothèque</h1>
      {texts.map(t => (
        <div key={t.id} className="p-4 bg-white rounded shadow space-y-2">
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="text-sm text-gray-600">
            {t.authorName} — {new Date(t.createdAt).toLocaleDateString()}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span>👁 {t.views} | ❤️ {t.likesCount} | 💬 {t.commentsCount}</span>
            <Link href={`/texts/${t.id}`} className="btn btn-primary">
              Lire
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}