"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function CommentSection({ textId, saveToGitHub, text, setText }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Charger les commentaires depuis localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`comments-${textId}`) || "[]");
    setComments(stored);
  }, [textId]);

  const getDisplayName = () => session?.user?.name || "Invité";

  const handleAddComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newComment.trim()) return;

    const comment = {
      author: getDisplayName(),
      content: newComment.trim(),
      date: new Date().toISOString(),
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment("");

    // Persistance locale
    localStorage.setItem(`comments-${textId}`, JSON.stringify(updatedComments));

    toast.success("Commentaire publié !");

    // Persistance sur GitHub
    if (text && saveToGitHub) {
      const updatedText = { ...text, comments: updatedComments };
      setText(updatedText);
      await saveToGitHub(updatedText);
    }
  };

  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-semibold mb-2">
        💬 Commentaires ({comments.length})
      </h3>

      <ul className="space-y-2 mb-4">
        {comments.map((c, i) => (
          <li key={i} className="p-2 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              {c.author} • {new Date(c.date).toLocaleString()}
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
        type="button" // Empêche le submit par défaut
        onClick={handleAddComment}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Commenter
      </button>
    </div>
  );
}