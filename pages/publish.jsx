"use client";
import { useState } from "react";
import { texts, authors } from "@/lib/data";

export default function Publish() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = () => {
    const author = authors[0];
    texts.push({
      id: "text" + (texts.length + 1),
      title,
      content,
      imageUrl,
      authorId: author.uid,
      authorName: author.fullName,
      createdAt: Date.now(),
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      likes: [],
      viewsList: [],
      comments: []
    });
    alert("Texte publié !");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Publier un texte</h1>
      <input
        placeholder="Titre"
        className="border p-2 mb-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Contenu"
        className="border p-2 mb-2 w-full"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        placeholder="URL image"
        className="border p-2 mb-2 w-full"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <button onClick={handleSubmit} className="bg-blue-600 text-white p-2">
        Publier
      </button>
    </div>
  );
}