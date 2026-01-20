"use client";

import { useEffect, useState } from "react";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/texts")
      .then((res) => res.json())
      .then(setTexts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Chargement...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">📚 Bibliothèque</h1>

      {texts.length === 0 && <p>Aucun texte publié.</p>}

      <ul className="space-y-4">
        {texts.map((text) => (
          <li key={text.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{text.title}</h2>
            <p className="text-sm text-gray-500">
              par {text.authorName}
            </p>
            <p className="mt-2">{text.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}