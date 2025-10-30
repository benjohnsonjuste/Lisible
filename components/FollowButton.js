"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function FollowButton({ authorUid, currentUser }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Connecte-toi pour suivre un auteur.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/follow-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uidToFollow: authorUid,
          followerUid: currentUser.uid,
          followerName: currentUser.name,
          followerEmail: currentUser.email,
        }),
      });

      if (!res.ok) throw new Error("Erreur d'abonnement");
      toast.success("Tu suis maintenant cet auteur !");
      setIsFollowing(true);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de suivre cet auteur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading || isFollowing}
      className={`px-4 py-2 rounded-lg text-white font-medium transition ${
        isFollowing
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading
        ? "Chargement..."
        : isFollowing
        ? "Abonné ✅"
        : "Suivre"}
    </button>
  );
}