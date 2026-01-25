"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Bell, Users, Sparkles } from "lucide-react";
import LisibleClub from "@/components/LisibleClub";
import LisibleClubClosed from "@/components/LisibleClubClosed";
import Link from "next/link";

export default function ClubPage() {
  const [liveStatus, setLiveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger l'utilisateur local
        const loggedUser = localStorage.getItem("lisible_user");
        if (loggedUser) setUser(JSON.parse(loggedUser));

        // 2. Charger le statut global du live
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/live_status.json?t=${Date.now()}`);
        const data = await res.json();
        setLiveStatus(data);
      } catch (e) {
        console.error("Erreur:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-teal-600">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest">Entrée au Club...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, on lui demande de s'identifier
  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-400">
           <Users size={40} />
        </div>
        <h2 className="text-3xl font-black italic text-slate-900 mb-4">Espace Réservé</h2>
        <p className="text-slate-500 mb-8 font-medium">Connectez-vous pour rejoindre les lives ou lancer votre propre session de lecture.</p>
        <Link href="/login" className="inline-block bg-teal-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-teal-100">
          Se Connecter
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 pt-16 pb-24 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${liveStatus?.isLive ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/20 text-slate-400'}`}>
              <Radio size={14} className={liveStatus?.isLive ? "animate-pulse" : ""} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {liveStatus?.isLive ? "Une plume s'exprime" : "Studio ouvert à tous"}
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter mb-4">
            Lisible Club<span className="text-teal-500">.</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl italic">
            L'espace où chaque auteur devient une voix. Écoutez ou prenez la parole en direct.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20">
        {/* On affiche le composant de Live : 
            - Soit parce qu'un live est déjà en cours.
            - Soit pour permettre à l'utilisateur actuel d'en lancer un (isHost={true} par défaut). */}
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <LisibleClub 
            roomId={liveStatus?.isLive ? liveStatus.roomId : `room-${user.name.toLowerCase()}`} 
            mode="video" 
            isHost={!liveStatus?.isLive} // Si aucun live n'est en cours, l'utilisateur peut devenir l'hôte
          />
          
          {!liveStatus?.isLive && (
            <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 italic uppercase text-xs tracking-widest">C'est votre tour ?</h3>
                <p className="text-slate-500 text-sm italic">Aucun live n'est en cours. Cliquez sur "Lancer le Live" pour partager votre plume avec la communauté.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
