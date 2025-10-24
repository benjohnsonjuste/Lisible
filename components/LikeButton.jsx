"use client";

import { useState, useEffect } from "react";

// Props : textId (identifiant du texte), initialCount (nombre initial de likes)
export default function LikeButton({ textId, initialCount = 0 }) {
  const [likes, setLikes] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    // Récupérer le vote précédent depuis localStorage
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    if (votes[textId] === true) setHasLiked(true);
  }, [textId]);

  const handleLike = async () => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    if (hasLiked) return; // ne permet qu’un like par utilisateur

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);

    // Sauvegarde local
    votes[textId] = true;
    localStorage.setItem("likes", JSON.stringify(votes));

    // Mise à jour GitHub
    try {
      await fetch("/api/update-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId, likes: newLikes }),
      });
    } catch (err) {
      console.error("Erreur mise à jour like GitHub :", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        className={`px-2 py-1 rounded ${
          hasLiked ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
        }`}
        title={hasLiked ? "Vous avez déjà liké" : "Cliquez pour liker"}
      >
        👍
      </button>
      <span className="ml-2 text-sm">{likes}</span>
    </div>
  );
}