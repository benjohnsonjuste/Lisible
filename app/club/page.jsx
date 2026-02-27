"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, PlayCircle, PlusCircle, Mic, Video, Loader2 } from "lucide-react";
import ReplayCard from "@/components/ReplayCard";

export default function ClubExplorer() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Adaptation : On interroge l'API dédiée au live
        const res = await fetch('/api/live');
        const data = await res.json();
        setLiveData(data);
      } catch (e) {
        console.error("Erreur de récupération des salons");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Logique : Si isActive est true, on l'affiche en direct. 
  // Si isActive est false mais qu'il y a un transcript, c'est une archive.
  const activeLive = liveData && liveData.isActive ? liveData : null;
  // Pour les replays, on simule une liste à partir de la donnée actuelle si elle est inactive
  const pastReplays = liveData && !liveData.isActive && liveData.roomID ? [liveData] : [];

  return (
    <div className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter text-white mb-2 leading-none">
              Club<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Salons littéraires et artistiques en temps réel.</p>
          </div>
          <Link href="/club/host">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl shadow-blue-600/30">
              <PlusCircle size={18}/> Lancer mon direct
            </button>
          </Link>
        </div>

        {/* SECTION : EN DIRECT */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-3 h-3 rounded-full ${activeLive ? "bg-rose-500 animate-pulse" : "bg-slate-700"}`} />
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Le Direct</h2>
          </div>

          {loading ? (
             <div className="py-20 flex justify-center text-blue-500">
               <Loader2 className="animate-spin" size={40} />
             </div>
          ) : activeLive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Link href={`/live/${activeLive.roomID}`}>
                  <div className="group bg-slate-900 border border-white/5 rounded-[3rem] p-10 hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative">
                        <img 
                          src={activeLive.hostAvatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${activeLive.admin}`} 
                          className="w-20 h-20 rounded-[2rem] object-cover ring-4 ring-white/5" 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-rose-600 p-2 rounded-xl text-white">
                           <Radio size={14} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white text-xl font-black italic tracking-tight group-hover:text-blue-400 transition-colors leading-tight">
                          {activeLive.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Par l'admin {activeLive.admin.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-5 rounded-3xl border border-white/5">
                       <span className="text-[10px] font-black text-blue-400 flex items-center gap-3">
                         {activeLive.type === 'audio' ? <Mic size={16}/> : <Video size={16}/>} {activeLive.type.toUpperCase()}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rejoindre la salle →</span>
                    </div>
                  </div>
                </Link>
            </div>
          ) : (
            <div className="py-24 text-center bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-white/5">
              <p className="text-slate-600 font-serif italic text-xl">Aucun salon n'est ouvert pour le moment.</p>
            </div>
          )}
        </section>

        {/* SECTION : REPLAYS */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Archives récentes</h2>
            <Link href="/archives" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Voir tout le catalogue</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pastReplays.length > 0 ? (
                pastReplays.map((replay, idx) => (
                    <ReplayCard key={idx} replay={replay} />
                ))
            ) : (
                <p className="text-slate-700 text-[10px] font-black uppercase tracking-widest">Aucune archive disponible.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
