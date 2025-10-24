"use client";

import { useEffect, useState } from "react";

export default function LikeButton({ textId, initialCount = 0 }) {
  const [likes, setLikes] = useState(initialCount);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    if (votes[textId]) setUserVote(votes[textId]);
  }, [textId]);

  const handleVote = async (voteType) => {
    const votes = JSON.parse(localStorage.getItem("likes") || "{}");
    let newVote = voteType;

    if (userVote === voteType) newVote = null;

    let newLikes = likes;
    if (userVote === "like") newLikes -= 1;
    if (newVote === "like") newLikes += 1;

    setLikes(newLikes);
    setUserVote(newVote);

    votes[textId] = newVote;
    localStorage.setItem("likes", JSON.stringify(votes));

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
        className={`px-2 py-1 rounded ${userVote === "like" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
      >
        👍
      </button>
      <span>{likes}</span>
    </div>
  );
}