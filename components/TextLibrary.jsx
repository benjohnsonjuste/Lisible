"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TextLibrary() {
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    async function fetchTexts() {
      const res = await fetch("/data/texts/index.json");
      const data = await res.json();
      setTexts(data);
    }
    fetchTexts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {texts.map((t) => (
        <div key={t.id} className="border p-4 rounded shadow">
          {t.image && (
            <img
              src={t.image.replace(".json", "")} // afficher image
              alt={t.title}
              className="w-full h-48 object-cover rounded mb-2"
            />
          )}
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p>
            Auteur:{" "}
            <Link href={`/auteur/${t.authorId}`} className="text-blue-600">
              {t.authorName}
            </Link>
          </p>
          <Link
            href={`/texts/${t.id}`}
            className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded"
          >
            Lire
          </Link>
        </div>
      ))}
    </div>
  );
}