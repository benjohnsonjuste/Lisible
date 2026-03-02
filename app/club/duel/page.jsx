"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Sword, Timer, Trophy, Zap, Ghost } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Vérifie que le chemin @/components/DuelArena est correct par rapport à ta racine
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
    
    // Logique de phase
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
      const res = await fetch(`/api/github-db?type=duels&t=${Date.now()}`);
      
      // Si l'API elle-même renvoie une 404, c'est là le problème
      if (!res.ok) {
        console.error("L'API /api/github-db est introuvable");
        return;
      }

      const data = await res.json();
      const current = data.content?.[data.content.length - 1];
      
      if (current) {
        setDuel(current);
        determinePhase(current);
      }
    } catch (e) {
      console.error("Erreur Fetch:", e);
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
      <span className="text-white text-[10px] tracking-widest uppercase">Chargement de l'arène...</span>
    </div>
  );

  // Si aucun duel n'est trouvé dans la base de données
  if (!duel) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <Ghost size={50} className="text-slate-700 mb-4" />
      <h2 className="text-white font-black uppercase tracking-tighter text-xl">Arène indisponible</h2>
      <p className="text-slate-500 text-sm mt-2">Aucune donnée de duel trouvée sur le serveur.</p>
    </div>
  );

  if (phase === "active") return <DuelArena duelData={duel} currentUser={currentUser} />;

  // Rendu par défaut (Attente ou Résultats)
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
       <Sword size={40} className="text-rose-500 mb-6" />
       <h1 className="text-5xl font-black italic">Club de Duel</h1>
       <p className="text-slate-400 mt-4 uppercase tracking-widest text-xs">Phase actuelle : {phase}</p>
    </div>
  );
}
