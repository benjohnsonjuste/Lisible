"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  const username = "UserTest"; // remplacer par GitHub login ou pseudo

  useEffect(() => {
    if (!id) return;
    const fetchText = async () => {
      try {
        const res = await fetch(`/data/texts/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        setText(await res.json());
        setLoading(false);
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchText();
  }, [id]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: id, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setText({ ...text, likes: text.likes ? [...text.likes, username] : [username] });
      toast.success("Like enregistré !");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: id, username, comment: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setText({ ...text, comments: data.comments });
      setCommentText("");
      toast.success("Commentaire ajouté !");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!text) return <p className="text-center mt-10">Texte introuvable</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-6">
      {text.image && <img src={text.image} className="w-full h-64 object-cover rounded-xl" />}
      <h1 className="text-3xl font-bold">{text.title}</h1>
      <p className="whitespace-pre-line">{text.content}</p>

      <div className="flex gap-4 items-center pt-4 border-t">
        <button onClick={handleLike} className="cursor-pointer">
          ❤️ {text.likes?.length || 0}
        </button>
        <span className="ml-auto">Commentaires {text.comments?.length || 0}</span>
      </div>

      <form onSubmit={handleComment} className="mt-3 flex flex-col gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Écrire un commentaire..."
        />
        <button className="self-end px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Publier
        </button>
      </form>

      {text.comments?.length > 0 && (
        <ul className="space-y-2">
          {text.comments.map((c, i) => (
            <li key={i} className="p-2 border rounded">
              <p><strong>{c.author}</strong> · {new Date(c.date).toLocaleString()}</p>
              <p>{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}