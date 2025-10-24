"use client";

import { useState, useEffect } from "react";

// Props : textId (identifiant du texte), initialCount (nombre initial de likes)
export default function LikeButton({ textId, initialCount = 0 }) {
  const [likes, setLikes] = useState(initialCount);
  const [userVote, setUserVote] = useState(null); // 'like', 'dislike', ou null

  useEffect(() => {
    // Récupérer le vote précédent depuis localStorage
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    if (votes[textId]) setUserVote(votes[textId]);
  }, [textId]);

  const handleVote = async (voteType) => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    let newVote = voteType;

    if (userVote === voteType) {
      // Si l'utilisateur reclique sur le même vote => annuler
      newVote = null;
    }

    // Calcul du nouveau compteur local
    let newLikes = likes;
    if (userVote === "like") newLikes -= 1;
    if (userVote === "dislike") newLikes += 1; // optionnel si on gère dislikes
    if (newVote === "like") newLikes += 1;
    if (newVote === "dislike") newLikes -= 1; // optionnel si on gère dislikes

    setLikes(newLikes);
    setUserVote(newVote);

    // Sauvegarde local
    votes[textId] = newVote;
    localStorage.setItem("likes", JSON.stringify(votes));

    // Mise à jour GitHub (index.json) si tu veux
    try {
      await fetch("/api/update-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId, vote: newVote }),
      });
    } catch (err) {
      console.error("Erreur mise à jour like GitHub :", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote("like")}
        className={`px-2 py-1 rounded ${
          userVote === "like" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
        }`}
      >
        👍
      </button>
      <button
        onClick={() => handleVote("dislike")}
        className={`px-2 py-1 rounded ${
          userVote === "dislike" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
        }`}
      >
        👎
      </button>
      <span className="ml-2 text-sm">{likes}</span>
    </div>
  );
}