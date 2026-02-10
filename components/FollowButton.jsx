"use client";
import React, { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FollowButton({ targetEmail, initialIsFollowing }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleFollow = async () => {
    if (!user) return toast.error("Connectez-vous pour suivre cet auteur");
    if (user.email === targetEmail) return toast.error("Vous ne pouvez pas vous suivre vous-même");

    setLoading(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_follow",
          userEmail: user.email,
          targetEmail: targetEmail
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        toast.success(data.isFollowing ? "Abonnement ajouté" : "Abonnement retiré");
      }
    } catch (e) {
      toast.error("Erreur de liaison au Grand Livre");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
        isFollowing 
        ? "bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600" 
        : "bg-teal-600 text-white shadow-lg shadow-teal-500/20 hover:bg-teal-700"
      }`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isFollowing ? (
        <><UserMinus size={14} /> Se désabonner</>
      ) : (
        <><UserPlus size={14} /> Suivre l'auteur</>
      )}
    </button>
  );
}
