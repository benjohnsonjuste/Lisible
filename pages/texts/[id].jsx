"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TextPage({ params }) {
  const [text, setText] = useState(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    fetch(`/api/texts/${id}`)
      .then(res => res.json())
      .then(data => setText(data));

    // Increment views unique par sessionStorage
    const viewed = sessionStorage.getItem(`viewed-${id}`);
    if (!viewed) {
      fetch(`/api/texts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ views: text?.views + 1 || 1 })
      });
      sessionStorage.setItem(`viewed-${id}`, "true");
    }
  }, [id]);

  if (!text) return <p>Chargement...</p>;

  const handleLike = () => {
    const liked = localStorage.getItem(`liked-${id}`);
    if (!liked) {
      fetch(`/api/texts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likesCount: text.likesCount + 1 })
      }).then(() => {
        setText(prev => ({ ...prev, likesCount: prev.likesCount + 1 }));
        localStorage.setItem(`liked-${id}`, "true");
      });
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!message) return;
    const authorName = prompt("Votre nom") || "Auteur Anonyme";
    await fetch(`/api/texts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName, authorId: "user-" + Date.now(), message })
    });
    const updated = await fetch(`/api/texts/${id}`).then(res => res.json());
    setText(updated);
    setMessage("");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{text.title}</h1>
      <p className="text-sm text-gray-600">{text.authorName} — {new Date(text.createdAt).toLocaleDateString()}</p>
      {text.imageUrl && <img src={text.imageUrl} className="w-full rounded" />}
      <p className="mt-4">{text.content}</p>

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleLike}
          className={`btn ${localStorage.getItem(`liked-${id}`) ? "bg-red-500 text-white" : "btn-primary"}`}
        >
          ❤️ {text.likesCount}
        </button>
        <span>👁 {text.views}</span>
        <button
          onClick={() => navigator.clipboard.writeText(location.href)}
          className="btn btn-primary"
        >
          🔗 Partager
        </button>
      </div>

      <form onSubmit={handleComment} className="mt-6 space-y-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ajouter un commentaire"
          className="w-full p-2 border rounded h-24"
          required
        />
        <button type="submit" className="btn btn-primary">Commenter</button>
      </form>

      <div className="mt-4 space-y-2">
        {text.comments.map(c => (
          <div key={c.id} className="p-2 border rounded bg-gray-50">
            <p className="text-sm text-gray-600">{c.authorName} — {new Date(c.createdAt).toLocaleDateString()}</p>
            <p>{c.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}