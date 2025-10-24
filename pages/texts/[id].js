"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import LikeButton from "@/components/LikeButton";

export default function ReadTextPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // Charger le texte + commentaires
  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch("/api/github-texts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur de chargement");

        const found = json.data.find((t) => t.id === id);
        if (!found) throw new Error("Texte introuvable");

        setText(found);

        // Charger les commentaires associés
        const commentsRes = await fetch(`/api/github-comments?textId=${id}`);
        const commentsJson = await commentsRes.json();
        if (commentsRes.ok) setComments(commentsJson.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger ce texte.");
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id]);

  const handleAddComment = async () => {
    if (!user) {
      router.push(`/login?redirect=/texts/${id}`);
      return;
    }
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch("/api/github-add-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId: text.id,
          authorName: user.displayName || user.email || "Utilisateur",
          authorEmail: user.email || "",
          content: newComment,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur ajout commentaire");

      setComments([...comments, json.comment]);
      setNewComment("");
      toast.success("Commentaire ajouté !");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'ajouter le commentaire");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <p>Chargement du texte...</p>;
  if (!text) return <p>Texte introuvable</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
      <button onClick={() => router.push("/bibliotheque")} className="text-blue-600 mb-4">
        ← Retour
      </button>

      {text.image && (
        <img src={text.image} alt={text.title} className="w-full h-64 object-cover rounded mt-4" />
      )}

      <h1 className="text-3xl font-bold mt-4">{text.title}</h1>
      <p className="text-sm text-gray-500">
        Auteur: {text.authorName} | Genre: {text.genre}
      </p>
      <p className="mt-4 whitespace-pre-wrap">{text.content}</p>

      <div className="mt-4 flex items-center justify-between">
        <LikeButton textId={text.id} initialCount={text.likes} />
        <span>{comments.length} commentaire{comments.length > 1 ? "s" : ""}</span>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Commentaires</h2>

        {comments.length === 0 && <p className="text-gray-500 mb-4">Pas encore de commentaires.</p>}

        <div className="space-y-4 mb-4">
          {comments.map((c, i) => (
            <div key={i} className="p-3 border rounded-lg bg-gray-50">
              <p className="text-sm font-semibold">{c.authorName}</p>
              <p className="text-sm text-gray-700">{c.content}</p>
              <p className="text-xs text-gray-400">{new Date(c.date).toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Écrire un commentaire..." : "Connectez-vous pour commenter"}
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
            disabled={!user}
          />
          <button
            onClick={handleAddComment}
            disabled={commentLoading || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg w-fit"
          >
            {commentLoading ? "Envoi..." : "Commenter"}
          </button>
        </div>
      </section>
    </main>
  );
