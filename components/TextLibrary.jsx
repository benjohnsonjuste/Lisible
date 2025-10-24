"use client";

import { useState, useEffect } from "react";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection"; // gestion des commentaires
import { useAuth } from "@/context/AuthContext";

export default function TextLibrary() {
  const { user } = useAuth();
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTexts() {
      try {
        const res = await fetch("/api/github-texts"); // récupère index.json
        const json = await res.json();
        if (res.ok && json.success) {
          setTexts(json.data);
        } else {
          console.error("Erreur fetch textes", json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTexts();
  }, []);

  if (loading) return <p className="text-center p-4">Chargement des textes...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {texts.map((text) => (
        <div key={text.id} className="p-4 bg-white rounded shadow space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{text.title}</h3>
            <span className="text-sm text-gray-500">{text.genre}</span>
          </div>

          {text.image && (
            <img src={text.image} alt={text.title} className="rounded object-cover max-h-60 w-full" />
          )}

          <p className="text-gray-800">{text.excerpt}</p>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-500">{text.authorName}</span>

            {/* Likes disponibles pour tous */}
            <LikeButton textId={text.id} initialCount={text.likes} />
          </div>

          {/* Commentaires */}
          {user ? (
            <CommentSection textId={text.id} />
          ) : (
            <div className="mt-2">
              <a
                href={`/login?redirect=/bibliotheque#${text.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                Connectez-vous pour commenter
              </a>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-1">
            {text.comments} commentaire{text.comments > 1 ? "s" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}