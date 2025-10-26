"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthorPage() {
  const pathname = usePathname();
  const authorId = pathname.split("/").pop();

  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const res = await fetch(`/data/authors/${authorId}.json`);
        const data = await res.json();
        setAuthor(data);
      } catch (err) {
        console.error("Erreur chargement auteur :", err);
      }
    };
    fetchAuthor();
  }, [authorId]);

  if (!author) return <p>Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold">{author.name}</h1>
      {author.bio && <p>{author.bio}</p>}
      {author.texts && author.texts.length > 0 && (
        <ul className="space-y-2">
          {author.texts.map((textId) => (
            <li key={textId}>
              <a href={`/texts/${textId}`} className="text-blue-600 hover:underline">
                Lire le texte {textId}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
    }
