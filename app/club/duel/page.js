"use client";
import React, { useState, useEffect } from "react";
import { 
  Sword, Timer, UserCircle, Trophy, 
  Lock, Zap, Ghost, ScrollText, Heart 
} from "lucide-react";
import { toast } from "sonner";
import DuelArena from "@/components/DuelArena";

export default function DuelPage() {
  const [duel, setDuel] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("waiting"); // waiting, active, finished

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setCurrentUser(JSON.parse(logged));
    fetchCurrentDuel();
  }, []);

  const fetchCurrentDuel = async () => {
    try {
      const res = await fetch('/api/github-db?type=duels');
      const data = await res.json();
      // On récupère le duel le plus récent (celui de la semaine)
      const current = data.content?.[data.content.length - 1];
      
      if (current) {
        setDuel(current);
        determinePhase(current);
      }
    } catch (e) {
      console.error("Erreur duel:", e);
    } finally {
      setLoading(false);
    }
  };

  const determinePhase = (duelData) => {
    const now = new Date();
    const duelDate = new Date(duelData.date); 
    // Si c'est dimanche (0) et qu'on est dans la fenêtre de temps
    const isSunday = now.getDay() === 0;
    
    if (duelData.status === "finished") {
      setPhase("finished");
    } else if (isSunday && duelData.status === "scheduled") {
      setPhase("active");
    } else {
      setPhase("waiting");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Zap className="animate-pulse text-rose-500" size={40} />
    </div>
  );

  if (!duel) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <Ghost size={60} className="text-slate-800 mb-6" />
      <h1 className="text-2xl font-black text-white uppercase tracking-widest">Aucun duel programmé</h1>
      <p className="text-slate-500 mt-2 max-w-xs">Le silence règne dans l'arène. Revenez plus tard pour le prochain défi.</p>
    </div>
  );

  // --- ÉTAT 1 : L'ARÈNE ACTIVE (Dimanche) ---
  if (phase === "active") {
    return <DuelArena duelData={duel} currentUser={currentUser} />;
  }

  // --- ÉTAT 2 : RÉSULTATS (Après Samedi Soir) ---
  if (phase === "finished") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="inline-block p-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 animate-bounce">
            <Trophy size={48} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter">Le Verdict est tombé.</h1>
          
          <div className="bg-white/5 border border-white/10 p-12 rounded-[4rem] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            <p className="text-slate-400 uppercase tracking-[0.4em] text-[10px] mb-4 font-black">Nouveau détenteur du badge</p>
            <h2 className="text-4xl font-serif text-amber-400 italic">L'Auteur Anonyme du Joueur {duel.winner === duel.participants[0] ? '1' : '2'}</h2>
            <p className="mt-8 text-slate-300 leading-relaxed text-lg italic italic">"{duel.texts[duel.winner].substring(0, 150)}..."</p>
          </div>

          <button onClick={() => window.location.href='/community'} className="px-12 py-5 bg-white text-slate-950 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
            Voir le Champion dans le Cercle
          </button>
        </div>
      </div>
    );
  }

  // --- ÉTAT 3 : ATTENTE (Toute la semaine) ---
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600/5 rounded-full blur-[120px]" />
      
      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        <div className="flex justify-center gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center text-rose-500">
            <Sword size={32} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black italic tracking-tighter leading-none">Duel de Plume.</h1>
          <p className="text-slate-400 uppercase tracking-[0.5em] text-[10px] font-black">Prévu pour ce Dimanche</p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-8">
           <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
              <Ghost size={24} className="mx-auto mb-4 text-slate-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Joueur 1</p>
              <p className="font-serif italic">Scellé</p>
           </div>
           <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5">
              <Ghost size={24} className="mx-auto mb-4 text-slate-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Joueur 2</p>
              <p className="font-serif italic">Scellé</p>
           </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
            <Timer size={18} className="text-rose-500" />
            <span className="font-mono text-xl font-bold tracking-widest">EN ATTENTE</span>
          </div>
          <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm">
            Les plumes sont taillées, l'encre est prête. Le thème sera révélé à l'ouverture de la session. Soyez prêts à voter pour le texte, pas pour le nom.
          </p>
        </div>
      </div>
    </div>
  );
}
