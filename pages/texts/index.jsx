"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TextsPage() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    fetch("/api/texts")
      .then(res => res.json())
      .then(setTexts)
      .catch(console.error);
  }, []);

  return (
    <div className="container-md py-6">
      <h1 className="text-3xl font-bold mb-6">Bibliothèque</h1>

      {texts.length === 0 ? (
        <p>Aucun texte disponible.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {texts.map(t => (
            <div key={t.id} className="p-4 border rounded shadow hover:shadow-lg transition">
              <h2 className="text-xl font-semibold">{t.title}</h2>
              <p className="text-sm text-gray-500">Par {t.authorName}</p>
              <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
              <p className="mt-2">{t.content.slice(0, 100)}...</p>
              <div className="flex justify-between mt-3 items-center">
                <Link href={`/texts/${t.id}`} className="btn btn-primary">Lire</Link>
                <div className="text-sm text-gray-600">
                   {t.likesCount}  {t.views}  {t.commentsCount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}