"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function CommentSection({ textId }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch("/api/github-comments");
        if (!res.ok) throw new Error("Erreur récupération commentaires");
        const json = await res.json();
        setComments(json.data.filter((c) => c.textId === textId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [textId]);

  const handleAddComment = async (e) => {
    e.preventDefault(); // Empêche le reload de page
    e.stopPropagation();

    if (!newComment.trim()) return;

    const comment = {
      textId,
      authorName: session?.user?.name || "Invité",
      content: newComment.trim(),
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/github-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });

      if (res.ok) {
        setComments([...comments, comment]);
        setNewComment("");
      } else {
        console.error("Erreur ajout commentaire:", await res.text());
      }
    } catch (err) {
      console.error("Erreur fetch API:", err);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">
        💬 Commentaires ({comments.length})
      </h3>

      <ul className="space-y-2 mb-4">
        {comments.map((c, i) => (
          <li key={i} className="p-2 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              {c.authorName} • {new Date(c.date).toLocaleString()}
            </p>
            <p>{c.content}</p>
          </li>
        ))}
      </ul>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        rows={3}
        placeholder="Ajouter un commentaire..."
        className="w-full p-2 border rounded mb-2"
      />

      <button
        type="button" // 🔹 Très important pour éviter le submit par défaut
        onClick={handleAddComment}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Commenter
      </button>
    </div>
  );
}