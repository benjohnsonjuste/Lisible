"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function TextPage({ params }) {
  const { id } = params;
  const { data: session } = useSession();
  const [text, setText] = useState(null);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const router = useRouter();

  const localStorageLikesKey = `liked-${id}`;
  const localStorageViewsKey = `viewed-${id}`;

  // Récupérer le texte et compter la vue unique
  useEffect(() => {
    const fetchText = async () => {
      const res = await fetch(`/api/text/${id}`);
      const data = await res.json();
      setText(data);

      // Compteur de vue unique par appareil
      if (!localStorage.getItem(localStorageViewsKey)) {
        const updated = { ...data, views: data.views + 1 };
        localStorage.setItem(localStorageViewsKey, "true");
        await fetch(`/api/text/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ views: updated.views })
        });
        setText(updated);
      }

      // Vérifier si déjà liké sur cet appareil
      if (localStorage.getItem(localStorageLikesKey)) setLiked(true);
    };
    fetchText();
  }, [id]);

  // Like animé unique
  const handleLike = async () => {
    if (!session) {
      alert("Vous devez être connecté pour liker.");
      return;
    }
    if (liked) return; // unique like
    const updated = { ...text, likesCount: text.likesCount + 1 };
    setText(updated);
    setLiked(true);
    localStorage.setItem(localStorageLikesKey, "true");

    // Enregistrer le like dans le fichier JSON
    await fetch(`/api/text/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likesCount: updated.likesCount })
    });
  };

  // Ajouter un commentaire
  const handleComment = async (e) => {
    e.preventDefault();
    if (!session) {
      alert("Vous devez être connecté pour commenter.");
      return;
    }
    const res = await fetch(`/api/text/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: session.user.name,
        authorId: session.user.id,
        message: comment
      })
    });
    const newComment = await res.json();
    setText((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment],
      commentsCount: prev.commentsCount + 1
    }));
    setComment("");
  };

  if (!text) return <p>Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">{text.title}</h1>
      {text.imageUrl && <img src={text.imageUrl} alt={text.title} className="w-full rounded" />}
      <p className="mt-4">{text.content}</p>

      <div className="flex items-center space-x-4 mt-4">
        <button
          onClick={handleLike}
          className={`btn px-4 py-2 rounded font-bold transition-colors ${
            liked ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ❤️ {text.likesCount}
        </button>
        <span className="text-gray-500">👁 {text.views}</span>
        <span className="text-gray-500">💬 {text.commentsCount}</span>
        <button
          onClick={() => navigator.share && navigator.share({ title: text.title, text: text.content })}
          className="btn bg-blue-500 text-white hover:bg-blue-600"
        >
          🔗 Partager
        </button>
      </div>

      {/* Commentaires */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Commentaires</h2>
        {text.comments.map((c) => (
          <div key={c.id} className="p-2 border rounded bg-gray-50">
            <span className="font-bold">{c.authorName}</span> : {c.message}
          </div>
        ))}
        <form onSubmit={handleComment} className="flex space-x-2 mt-2">
          <input
            type="text"
            placeholder="Ajouter un commentaire..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 p-2 border rounded"
            required
          />
          <button type="submit" className="btn btn-primary">Envoyer</button>
        </form>
      </div>
    </div>
  );
}