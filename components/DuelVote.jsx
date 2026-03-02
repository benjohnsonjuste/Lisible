"use client";
import React, { useState, useEffect } from "react";
import { Heart, Check } from "lucide-react";
import { toast } from "sonner";

export default function DuelVote({ duelId, targetEmail, currentUser }) {
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
    if (history[duelId]) setVoted(true);
  }, [duelId]);

  const castVote = async () => {
    if (voted) return;
    if (currentUser?.li < 1) return toast.error("1 Li requis pour voter.");

    const res = await fetch('/api/github-db', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'vote', duelId, targetEmail, voterEmail: currentUser.email })
    });

    if (res.ok) {
      const history = JSON.parse(localStorage.getItem("duel_votes") || "{}");
      history[duelId] = true;
      localStorage.setItem("duel_votes", JSON.stringify(history));
      setVoted(true);
      toast.success("Vote pris en compte !");
    }
  };

  return (
    <button
      onClick={castVote}
      disabled={voted}
      className={`group flex items-center gap-3 px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
        voted ? "bg-teal-500 text-slate-900" : "bg-white/10 text-white hover:bg-rose-600 shadow-xl"
      }`}
    >
      {voted ? <Check size={14} /> : <Heart size={14} className="group-hover:fill-current" />}
      {voted ? "Voté" : "Voter pour ce texte"}
    </button>
  );
}
