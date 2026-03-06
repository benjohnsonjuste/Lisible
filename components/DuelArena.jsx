"use client";
import React, { useState, useEffect, useRef } from "react";
import { Timer, Trophy, UserCircle, Ghost, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import DuelVote from "./DuelVote";
import DuelResults from "./DuelResults";

export default function DuelArena({ duelData, currentUser }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15:00
  const [status, setStatus] = useState(duelData.status === "finished" ? "finished" : "playing");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isPlayer = duelData.participants.includes(currentUser?.email);
  
  const contentRef = useRef(content);
  useEffect(() => { contentRef.current = content; }, [content]);

  // 1. Chrono principal
  useEffect(() => {
    if (status === "playing") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStatus("voting");
            if (isPlayer) submitFinalText(contentRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, isPlayer]);

  // 2. Mécanisme d'Autosave (Toutes les 30 secondes)
  useEffect(() => {
    if (status === "playing" && isPlayer) {
      const autosaveInterval = setInterval(() => {
        if (contentRef.current.trim().length > 0) {
          saveProgress(contentRef.current);
        }
      }, 30000);
      return () => clearInterval(autosaveInterval);
    }
  }, [status, isPlayer]);

  const saveProgress = async (textToSave) => {
    setIsSaving(true);
    try {
      await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'saveDuelText', 
          duelId: duelData.id, 
          text: textToSave, 
          email: currentUser.email 
        })
      });
    } catch (e) {
      console.error("Échec de l'autosave");
    } finally {
      setTimeout(() => setIsSaving(false), 2000);
    }
  };

  const submitFinalText = async (textToSave) => {
    const t = toast.loading("Scellage du manuscrit...");
    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'saveDuelText', 
          duelId: duelData.id, 
          text: textToSave, 
          email: currentUser.email 
        })
      });
      if (res.ok) toast.success("Manuscrit scellé pour l'éternité !", { id: t });
      else throw new Error();
    } catch (e) {
      toast.error("Erreur de sauvegarde finale.", { id: t });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans selection:bg-rose-500/30">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 border-b border-white/5 pb-8 gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-rose-500" />
            <h2 className="text-rose-500 font-black text-[10px] uppercase tracking-[0.4em]">Thème Imposé par le Sort</h2>
          </div>
          <p className="text-3xl md:text-4xl font-serif italic text-slate-200 leading-tight">
            « {duelData.theme || "Le silence d'une plume abandonnée."} »
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          {isPlayer && status === "playing" && (
            <div className={`flex items-center gap-2 transition-opacity duration-500 ${isSaving ? 'opacity-100' : 'opacity-20'}`}>
              <Save size={14} className="text-teal-500" />
              <span className="text-[8px] font-bold uppercase tracking-tighter text-teal-500">Autosave</span>
            </div>
          )}

          <div className="flex items-center gap-4 bg-white/5 px-8 py-4 rounded-3xl border border-white/10 shadow-2xl shadow-rose-500/5">
            {status === "finished" ? (
              <Trophy className="text-amber-500" size={28} />
            ) : (
              <Timer className={timeLeft < 60 ? "text-rose-500 animate-pulse" : "text-teal-500"} size={28} />
            )}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {status === "finished" ? "Duel Terminé" : "Temps restant"}
              </span>
              <span className="text-3xl font-mono font-black tabular-nums">
                {status === "finished" ? "FIN" : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RÉSULTATS (AFFICHÉS SI FINI) */}
      {status === "finished" && (
        <div className="mb-20 animate-in fade-in zoom-in duration-1000">
          <DuelResults duelData={duelData} />
        </div>
      )}

      {/* ZONE DE COMBAT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {duelData.participants.map((email, index) => {
          const isMe = currentUser?.email === email;
          const participantText = duelData.texts?.[email] || "";
          const isWinner = duelData.winner === email;
          
          return (
            <div key={email} className="group space-y-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4 text-slate-500">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isWinner ? 'bg-amber-500/20 border-amber-500 text-amber-500' : isMe ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                    {isWinner ? <Trophy size={18} /> : isMe ? <UserCircle size={18} /> : <Ghost size={18} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isMe ? "Votre Plume" : `Concurrent ${index + 1}`} {isWinner && "• Vainqueur"}
                  </span>
                </div>
                {status === "voting" && (
                   <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">Vote Ouvert</span>
                   </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  readOnly={!isMe || status !== "playing"}
                  value={isMe && status === "playing" ? content : (status !== "playing" ? participantText : "")}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isMe ? "Que l'encre coule..." : "Le texte sera révélé à la fin du chrono."}
                  className={`w-full h-[550px] bg-white/5 p-10 rounded-[3rem] border-2 transition-all duration-700 font-serif text-xl md:text-2xl resize-none outline-none leading-relaxed ${
                    isWinner ? 'border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.05)]' :
                    isMe ? 'border-teal-500/20 focus:border-teal-500 shadow-[inset_0_0_40px_rgba(20,184,166,0.02)]' : 
                    'border-white/5 text-slate-400 italic'
                  } ${status === "voting" ? 'shadow-[0_0_60px_rgba(255,255,255,0.03)] border-white/10' : ''}`}
                />
                
                {!isMe && status === "playing" && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-[3rem] flex items-center justify-center p-12 text-center border border-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] leading-loose">
                      Texte scellé jusqu'à la fin du compte à rebours
                    </p>
                  </div>
                )}
              </div>

              {status === "voting" && !isPlayer && (
                <div className="flex justify-center pt-4 animate-in slide-in-from-bottom-4 duration-1000">
                  <DuelVote duelId={duelData.id} targetEmail={email} currentUser={currentUser} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="max-w-xl mx-auto mt-20 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.5em]">Lisible — Arène Officielle</p>
      </div>
    </div>
  );
}
