"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function CommentSection({ id, comments, onUpdate }) {
  const { user, redirectToAuth } = useUserProfile();
  const [commentText, setCommentText] = useState("");

  const saveToGitHub = async (data) => {
    await fetch("/api/github-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, data }),
    });
  };

  const handleComment = async () => {
    if (!user) return redirectToAuth(`/texts/${id}`);
    if (!commentText.trim()) return;

    const newComment = {
      author: user.displayName || user.email,
      content: commentText,
      date: new Date().toISOString(),
    };

    const updated = {
      ...comments,
      list: [...comments, newComment],
    };

    const newComments = [...comments, newComment];

    localStorage.setItem(`comments-${id}`, JSON.stringify(newComments));

    toast.success("Commentaire publié !");
    setCommentText("");

    onUpdate((prev) => ({ ...prev, comments: newComments }));
    saveToGitHub({ ...prev, comments: newComments });
  };

  return (
    <div className="pt-4 border-t">
      <h3 className="font-semibold mb-2">Commentaires ({comments.length})</h3>

      {comments.map((c, i) => (
        <div key={i} className="p-2 border rounded mb-2">
          <p className="text-sm text-gray-700">
            <strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}
          </p>
          <p>{c.content}</p>
        </div>
      ))}

      <textarea
        placeholder="Écrire un commentaire..."
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="w-full border rounded p-2 mt-2"
      />

      <button
        onClick={handleComment}
        className="px-4 py-2 mt-2 bg-green-600 text-white rounded"
      >
        Publier
      </button>
    </div>
  );
}