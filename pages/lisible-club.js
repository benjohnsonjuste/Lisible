"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Radio, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 1. On importe LisibleClub dynamiquement avec SSR désactivé
const LisibleClub = dynamic(() => import("@/components/LisibleClub"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
      <Loader2 className="animate-spin text-teal-600 mb-2" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialisation du flux...</span>
    </div>
  )
});

export default function ClubPage() {
  const [liveStatus, setLiveStatus] = useState({ isLive: false, roomId: null });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("lisible_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/live_status.json?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setLiveStatus(data);
        }
      } catch (e) {
        console.error("Erreur de chargement:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accès au Club...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center">
        <h2 className="text-3xl font-black italic mb-4">Espace Membres</h2>
        <p className="text-slate-500 mb-8">Connectez-vous pour rejoindre le live ou diffuser.</p>
        <Link href="/login" className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px]">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
      <div className="bg-slate-900 pt-16 pb-24 px-6 rounded-b-[3rem] shadow-xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${liveStatus?.isLive ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/10 border-white/20 text-slate-400'}`}>
              <Radio size={14} className={liveStatus?.isLive ? "animate-pulse" : ""} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {liveStatus?.isLive ? "En direct" : "Studio libre"}
              </span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-white italic mb-2">Lisible Club.</h1>
          <p className="text-slate-400 text-sm">Prenez le micro ou écoutez les auteurs de la communauté.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12">
        {/* Le composant chargé dynamiquement */}
        <LisibleClub 
          roomId={liveStatus?.isLive ? liveStatus.roomId : `club-${user?.id || 'studio'}`} 
          isHost={!liveStatus?.isLive} 
        />
        
        {!liveStatus?.isLive && (
          <div className="mt-8 bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="bg-teal-50 p-3 rounded-xl">
              <Sparkles className="text-teal-500" />
            </div>
            <p className="text-xs font-medium text-slate-500 italic">
              Personne n'est en live actuellement. En lançant le studio, vous devenez l'hôte !
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
