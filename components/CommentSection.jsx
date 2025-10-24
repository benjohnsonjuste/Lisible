"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function CommentSection({ textId }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Charger les commentaires depuis GitHub
    const fetchComments = async () => {
      try {
        const res = await fetch(`/data/comments/${textId}.json`);
        if (res.ok) {
          const json = await res.json();
          setComments(json);
        }
      } catch (e) {
        console.log("Pas encore de commentaires");
      }
    };
    fetchComments();
  }, [textId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user) return alert("Connecte-toi pour commenter");

    const res = await fetch("/api/comment-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        textId,
        userId: user.email,
        userName: user.displayName || user.email,
        comment,
      }),
    });

    const json = await res.json();
    if (res.ok) {
      setComments((prev) => [...prev, json.comment]);
      setComment("");
    } else {
      console.error(json.error);
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold text-lg mb-2">Commentaires ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Écris ton commentaire..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Envoyer</button>
      </form>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-800">{c.comment}</p>
            <p className="text-xs text-gray-500">
              — {c.userName} le {new Date(c.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}