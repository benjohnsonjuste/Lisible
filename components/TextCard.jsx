"use client";
import { useState } from "react";

export default function TextCard({ text }) {
  const [likes, setLikes] = useState(Number(text.likes || 0));

  const handleLike = async () => {
    setLikes(likes + 1);
    await fetch(`/api/github-like?id=${text.id}`, { method: "POST" });
  };

  return (
    <div className="border rounded shadow p-4 flex flex-col">
      {text.image && <img src={text.image} alt={text.title} className="h-48 object-cover mb-2 rounded" />}
      <h2 className="font-semibold text-lg">{text.title}</h2>
      <p className="text-sm text-gray-500 italic">{text.author}</p>
      <p className="text-gray-700 text-sm line-clamp-3">{text.excerpt}</p>
      <div className="mt-auto flex justify-between items-center">
        <button onClick={handleLike} className="px-2 py-1 bg-blue-500 text-white rounded">
          ❤️ Like {likes}
        </button>
      </div>
    </div>
  );
      }
