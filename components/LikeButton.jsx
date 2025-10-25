"use client";

import { useEffect, useState } from "react";

export default function LikeButton({ textId, initialCount = 0 }) {
  const [likes, setLikes] = useState(initialCount);
  const [userVote, setUserVote] = useState(null); // 'like', 'dislike', ou null

  // Charger le vote précédent depuis localStorage
  useEffect(() => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    if (votes[textId]) setUserVote(votes[textId]);
  }, [textId]);

  const handleVote = async (voteType) => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    let newVote = voteType;

    // Annuler si l'utilisateur reclique sur le même vote
    if (userVote === voteType) newVote = null;

    // Calcul du nouveau compteur
    let newLikes = likes;
    if (userVote === "like") newLikes -= 1;
    if (userVote === "dislike") newLikes += 1; // si on gère dislike
    if (newVote === "like") newLikes += 1;
    if (newVote === "dislike") newLikes -= 1;

    setLikes(newLikes);
    setUserVote(newVote);

    // Sauvegarder dans localStorage
    votes[textId] = newVote;
    localStorage.setItem("likes", JSON.stringify(votes));

    // Mise à jour GitHub (optionnelle)
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