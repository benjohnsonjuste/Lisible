"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Sword, Timer, Trophy, Zap, Ghost, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
// Correction de l'importation : ajout des accolades si InTextAd n'est pas un export par défaut
import { InTextAd } from "@/components/InTextAd"; 

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
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      // Calcule le prochain dimanche à 21h00
      target.setDate(now.getDate() + (7 - now.getDay()) % 7);
      target.setHours(21, 0, 0, 0);
      
      if (now > target) target.setDate(target.getDate() + 7);
      
      const diff = target.getTime() - now.getTime();
      setCountdown({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      });

      if (diff <= 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const determinePhase = useCallback((duelData) => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const isAfterTime = now.getHours() >= 21;
    
    if (duelData.status === "finished") setPhase("finished");
    else if (isSunday && isAfterTime && (duelData.status === "scheduled" || duelData.status === "active")) setPhase("active");
    else setPhase("waiting");
  }, []);

  const fetchCurrentDuel = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/duel-engine?t=${Date.now()}`);
      if (res.ok) {
        const duels = await res.json();
        const current = Array.isArray(duels) && duels.length > 0 ? duels[duels.length - 1] : null;
        if (current) {
          setDuel(current);
          determinePhase(current);
        }
      }
    } catch (e) { 
      console.error("Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  }, [determinePhase]);

  useEffect(() => {
    const logged = typeof window !== 'undefined' ? localStorage.getItem("lisible_user") : null;
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
      <Ghost size={40} className="text-slate-700 mb-6" />
      <h2 className="text-white font-black uppercase tracking-tighter text-2xl">Arène Silencieuse</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-xs mb-8">Aucun duel n'est programmé. Le calme règne sur le sable.</p>
      <a href="/club/duel/gestion" className="px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all">
        Lancer un gant
      </a>
    </div>
  );

  if (phase === "active") return (
    <>
      <DuelArena duelData={duel} currentUser={currentUser} />
      <div className="bg-[#050505] pb-20 px-6">
        <div className="max-w-4xl mx-auto border-t border-white/5 pt-10">
          <InTextAd />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
       <div className="mb-12 relative">
          <Sword size={60} className="text-rose-600 rotate-12" />
          <Sword size={60} className="text-rose-600 -rotate-12 absolute top-0 left-0 opacity-50 blur-sm" />
       </div>

       <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-8 uppercase">
         {phase === "finished" ? "Duel Clos" : "L'Attente"}
       </h1>

       {phase === "waiting" && (
         <div className="flex gap-4 md:gap-8 mb-12">
            {[
              { label: 'Jours', val: countdown.d },
              { label: 'Heures', val: countdown.h },
              { label: 'Min', val: countdown.m },
              { label: 'Sec', val: countdown.s }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl md:text-6xl font-mono font-black tabular-nums tracking-tighter">
                  {unit.val.toString().padStart(2, '0')}
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-500 mt-2">{unit.label}</span>
              </div>
            ))}
         </div>
       )}
       
       <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-full mb-12 backdrop-blur-md">
          <Clock size={14} className="text-rose-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {phase === "finished" ? "Résultats en cours d'archivage" : "Ouverture de l'arène ce dimanche"}
          </span>
       </div>

       <div className="w-full max-w-2xl mb-12">
          <InTextAd />
       </div>

       <p className="max-w-md text-slate-500 text-xs leading-relaxed italic opacity-60 uppercase tracking-widest">
         "Le silence avant la tempête est le moment où les plumes s'aiguisent dans l'ombre."
       </p>

       <a href="/club/duel/gestion" className="mt-16 text-white/30 hover:text-white text-[9px] font-black uppercase tracking-[0.5em] transition-all border-b border-white/5 pb-2">
         Accéder à l'Antichambre
       </a>
    </div>
  );
}
