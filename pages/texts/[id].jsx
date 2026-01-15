"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TextPage({ params }) {
  const { id } = params;
  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const router = useRouter();

  const fetchText = async () => {
    const res = await fetch(`/api/texts/${id}`);
    const data = await res.json();
    setText(data);

    // Compteur de vue unique
    const userId = "user-" + Date.now();
    await fetch(`/api/texts/${id}?type=view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: userId })
    });
  };

  useEffect(() => {
    fetchText();
  }, []);

  const handleLike = async () => {
    const userId = "user-" + Date.now();
    const res = await fetch(`/api/texts/${id}?type=like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: userId })
    });
    const data = await res.json();
    setText(prev => ({ ...prev, likesCount: data.likesCount }));
  };

  const handleComment = async () => {
    if (!comment.trim() || !authorName.trim()) return toast.error("Nom et commentaire obligatoires");
    const res = await fetch(`/api/texts/${id}?type=comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, authorId: "user-" + Date.now(), message: comment })
    });
    const newComment = await res.json();
    setText(prev => ({
      ...prev,
      comments: [...prev.comments, newComment],
      commentsCount: prev.commentsCount + 1
    }));
    setComment("");
  };

  if (!text) return <p>Chargement...</p>;

  return (
    <div className="container-md py-6">
      <h1 className="text-3xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-500">Par {text.authorName}</p>
      <p className="text-xs text-gray-400">{new Date(text.createdAt).toLocaleString()}</p>
      <p className="mt-4">{text.content}</p>

      <div className="flex items-center gap-4 mt-4">
        <button className="btn btn-primary" onClick={handleLike}> {text.likesCount}</button>
        <span> {text.views}</span>
        <span> {text.commentsCount}</span>
      </div>

      <div className="mt-6 space-y-2">
        <input
          type="text"
          value={authorName}
          onChange={e => setAuthorName(e.target.value)}
          placeholder="Votre nom"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Ajouter un commentaire"
          className="w-full p-2 border rounded h-20"
        />
        <button className="btn btn-primary" onClick={handleComment}>Commenter</button>
      </div>

      <div className="mt-4 space-y-2">
        {text.comments.map(c => (
          <div key={c.id} className="p-2 border rounded">
            <p className="font-semibold">{c.authorName}</p>
            <p>{c.message}</p>
            <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}