"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Sword, Timer, Trophy, Zap, Ghost, Calendar } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Chargement dynamique de l'arène pour éviter les erreurs de SSR sur le Timer
const DuelArena = dynamic(() => import("@/components/DuelArena"), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Zap className="animate-pulse text-rose-500" size={40} />
    </div>
  )
});

export default function DuelPage() {
  const [duel, setDuel] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("waiting");

  const determinePhase = useCallback((duelData) => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    
    if (duelData.status === "finished") {
      setPhase("finished");
    } else if (isSunday && (duelData.status === "scheduled" || duelData.status === "active")) {
      setPhase("active");
    } else {
      setPhase("waiting");
    }
  }, []);

  const fetchCurrentDuel = useCallback(async () => {
    try {
      setLoading(true);
      // Correction : On appelle l'API pour lire le fichier global des duels
      const res = await fetch(`/api/github-db?type=publications&t=${Date.now()}`); 
      // Note : Si ton API ne supporte pas encore type=duels, on ruse en attendant ou on utilise la route dédiée
      const resDuels = await fetch(`/api/duel-engine`, { method: 'GET' }).catch(() => null);
      
      // Fallback : Si l'API duel-engine n'a pas de GET, on simule la lecture du fichier via github-db si configuré
      const resDirect = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/duels.json?t=${Date.now()}`).catch(() => null);
      
      let duels = [];
      if (resDirect && resDirect.ok) {
        duels = await resDirect.json();
      }

      const current = Array.isArray(duels) ? duels[duels.length - 1] : null;
      
      if (current) {
        setDuel(current);
        determinePhase(current);
      }
    } catch (e) {
      console.error("Erreur Fetch Duel:", e);
    } finally {
      setLoading(false);
    }
  }, [determinePhase]);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setCurrentUser(JSON.parse(logged));
    fetchCurrentDuel();
  }, [fetchCurrentDuel]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <Zap className="animate-spin text-rose-500 mb-4" size={40} />
      <span className="text-white text-[10px] tracking-widest uppercase font-black">Initialisation de l'Arène...</span>
    </div>
  );

  if (!duel) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
        <Ghost size={40} className="text-slate-700" />
      </div>
      <h2 className="text-white font-black uppercase tracking-tighter text-2xl">Arène Silencieuse</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-xs">Aucun duel n'est programmé pour le moment. Lancez un défi dans l'Antichambre !</p>
      <a href="/club/duel/gestion" className="mt-8 px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all">
        Lancer un gant
      </a>
    </div>
  );

  if (phase === "active") return <DuelArena duelData={duel} currentUser={currentUser} />;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
       <div className="mb-12 relative">
          <Sword size={60} className="text-rose-600 rotate-12" />
          <Sword size={60} className="text-rose-600 -rotate-12 absolute top-0 left-0 opacity-50 blur-sm" />
       </div>

       <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4">
         {phase === "finished" ? "FIN DU DUEL" : "L'ATTENTE"}
       </h1>
       
       <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full mb-8">
          <Calendar size={14} className="text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {phase === "finished" ? "Résultats en cours de validation" : "Ouverture ce Dimanche à 21h00"}
          </span>
       </div>

       {phase === "finished" && duel.winner && (
         <div className="animate-bounce flex flex-col items-center gap-2">
            <Trophy className="text-amber-500" size={40} />
            <p className="text-amber-500 font-serif italic text-xl">Vainqueur : {duel.winner}</p>
         </div>
       )}

       <p className="max-w-md text-slate-500 text-sm leading-relaxed mt-4 italic">
         "Le silence avant la tempête est le moment où les plumes s'aiguisent dans l'ombre."
       </p>

       <a href="/club/duel/gestion" className="mt-12 text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors border-b border-white/10 pb-1">
         Retourner à la gestion des défis
       </a>
    </div>
  );
}
