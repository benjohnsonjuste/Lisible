"use client";
import React, { useState, useEffect } from "react";
import { Timer, Trophy, UserCircle, ShieldAlert, Ghost } from "lucide-react";
import { toast } from "sonner";
import DuelVote from "./DuelVote";

export default function DuelArena({ duelData, currentUser }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15:00
  const [status, setStatus] = useState("playing"); // playing, voting, finished
  const [content, setContent] = useState("");
  const isPlayer = duelData.participants.includes(currentUser?.email);

  useEffect(() => {
    if (status === "playing") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStatus("voting");
            if (isPlayer) submitFinalText();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  const submitFinalText = async () => {
    await fetch('/api/github-db', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'saveDuelText', duelId: duelData.id, text: content, email: currentUser.email })
    });
    toast.success("Manuscrit scellé !");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      {/* HEADER ANONYME */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-teal-500 font-black text-[10px] uppercase tracking-[0.4em] mb-2">Thème Imposé</h2>
          <p className="text-2xl font-serif italic text-slate-200">{duelData.theme}</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-3xl border border-white/10">
          <Timer className={timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-teal-500"} />
          <span className="text-3xl font-mono font-black">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* ZONE DE COMBAT CÔTE À CÔTE */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {duelData.participants.map((email, index) => {
          const isMe = currentUser?.email === email;
          return (
            <div key={email} className="space-y-6">
              <div className="flex items-center gap-4 text-slate-500">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Ghost size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Concurrent {index + 1}</span>
              </div>

              <textarea
                readOnly={!isMe || status !== "playing"}
                value={isMe ? content : (status !== "playing" ? duelData.texts[email] : "L'adversaire écrit...")}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Le silence est d'or, mais vos mots sont de platine..."
                className={`w-full h-[550px] bg-white/5 p-10 rounded-[3rem] border-2 transition-all duration-700 font-serif text-xl resize-none outline-none ${
                  isMe ? 'border-teal-500/20 focus:border-teal-500' : 'border-white/5'
                } ${status === "voting" ? 'shadow-[0_0_50px_rgba(20,184,166,0.1)]' : ''}`}
              />

              {/* VOTE : ACTIVÉ UNIQUEMENT SI PAS JOUEUR ET STATUS VOTING */}
              {status === "voting" && !isPlayer && (
                <div className="flex justify-center pt-4">
                  <DuelVote duelId={duelData.id} targetEmail={email} currentUser={currentUser} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
