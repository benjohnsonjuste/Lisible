// /components/CommentSection.js
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function CommentSection({ id, initialComments = [] }) {
  const { user, isLoading: userLoading, redirectToAuth } = (typeof useUserProfile === "function" ? useUserProfile() : { user: null, isLoading: false, redirectToAuth: (r)=>{ window.location.href = `/login?redirect=${r}` } });
  const [comments, setComments] = useState(Array.isArray(initialComments) ? initialComments : []);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`comments-${id}`) || "[]");
    if (stored.length) setComments(stored);
  }, [id]);

  const getDisplay = (userObj) => userObj?.displayName || userObj?.name || userObj?.email || "Utilisateur";

  const handlePublish = async () => {
    if (!text.trim()) return;
    if (!user) {
      // allow anonymous comments? you asked previously both options — here we force login
      return redirectToAuth(`/texts/${id}`);
    }

    const newComment = {
      author: { uid: user.uid, name: getDisplay(user) },
      content: text.trim(),
      date: new Date().toISOString(),
    };

    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem(`comments-${id}`, JSON.stringify(updated));
    setText("");
    toast.success("Commentaire publié !");

    // Save to GitHub
    setSaving(true);
    try {
      await fetch("/api/github-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedFields: { comments: updated } }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde commentaire:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Commentaires ({comments.length})</h3>

      {comments.length === 0 ? (
        <p className="text-gray-500">Aucun commentaire pour l'instant.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {comments.map((c, i) => (
            <li key={i} className="p-2 border rounded">
              <p className="text-sm text-gray-700">
                <strong>{c.author?.name || c.author}</strong> ·{" "}
                {new Date(c.date).toLocaleString()}
              </p>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <textarea className="w-full border rounded p-2" rows={4} value={text} onChange={(e)=>setText(e.target.value)} />
        <div className="flex justify-end">
          <button type="button" onClick={handlePublish} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {saving ? "Enregistrement..." : "Publier"}
          </button>
        </div>
      </div>
    </div>
  );
}