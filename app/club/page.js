"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, Radio, Mic, Users, 
  ArrowRight, Sparkles, Clock, 
  ChevronRight, PlayCircle, headphones 
} from "lucide-react";
import { Player } from "@livepeer/react";
import { toast } from "sonner";

export default function LisibleClub() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Récupérer l'état du Live et de la Bibliothèque
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/live?t=' + Date.now());
        const data = await res.json();
        setLiveData(data);
      } catch (e) {
        console.error("Erreur de récupération");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
    // Refresh toutes les 30 secondes pour voir si un live démarre
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-teal-500/30">
      
      {/* --- HERO SECTION : LE DIRECT --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-6xl mx-auto">
          {liveData?.isActive ? (
            /* SI UN LIVE EST EN COURS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-3 bg-rose-500/10 text-rose-500 px-5 py-2 rounded-full border border-rose-500/20 animate-pulse">
                  <Radio size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">En Direct Maintenant</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.95]">
                  {liveData.title}
                </h1>
                
                <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                  Rejoignez <span className="text-white font-bold">{liveData.admin.split('@')[0]}</span> et ses invités pour une immersion exclusive dans les coulisses de la création.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href={`/club/live/${liveData.roomID}`} className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-teal-400 transition-all group">
                    REJOINDRE LE CLUB <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex -space-x-3 items-center">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="auditeur" />
                      </div>
                    ))}
                    <span className="pl-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">+124 auditeurs</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                 <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 scale-110 blur-sm" alt="Studio" />
                 <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                       <Play size={32} fill="white" />
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            /* SI AUCUN LIVE : ÉTAT D'ATTENTE PRÉMIUM */
            <div className="text-center py-20 space-y-10">
              <div className="inline-flex items-center gap-2 bg-white/5 text-slate-400 px-4 py-2 rounded-full border border-white/10">
                <Sparkles size={14} className="text-teal-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Le Club est en préparation</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">
                L'ÉLITE DE LA <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">LITTÉRATURE</span>
              </h1>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                Entretiens secrets, masterclass en direct et duels de plume. 
                Le Club ouvre ses portes dès qu'un Maître prend l'antenne.
              </p>
              <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all">
                M'AVERTIR DU PROCHAIN LIVE
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- SECTION REPLAYS / PODCASTS --- */}
      <section className="max-w-6xl mx-auto px-6 pb-40">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-2xl font-black italic tracking-tight">LES DERNIERS REPLAYS</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Émissions & Podcasts archivés</p>
          </div>
          <Link href="/bibliotheque" className="text-xs font-black text-teal-400 flex items-center gap-2 hover:underline">
            VOIR TOUT <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card Podcast Item */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="group relative bg-[#0F0F10] rounded-[2.5rem] p-6 border border-white/5 hover:border-teal-500/30 transition-all hover:-translate-y-2">
              <div className="aspect-video bg-slate-800 rounded-3xl mb-6 overflow-hidden relative">
                <img 
                  src={`https://images.unsplash.com/photo-1478737270239-2fccd2c7fd94?q=80&w=500&auto=format&fit=crop&sig=${item}`} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  alt="Replay"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <PlayCircle size={48} className="text-white" />
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">
                   45:00
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-teal-500">
                   <headphones size={12} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Podcast Audio</span>
                </div>
                <h3 className="text-xl font-bold italic leading-tight group-hover:text-teal-400 transition-colors">
                  L'Art de la Guerre des Mots : Interview exclusive
                </h3>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                   <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/micah/svg?seed=Host" alt="host" />
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Par Pierre Woolsley</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER CLUB --- */}
      <footer className="border-t border-white/5 py-20 bg-black">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-6">
           <h3 className="text-3xl font-black italic opacity-20">LISIBLE CLUB</h3>
           <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.5em]">La voix des auteurs libres</p>
        </div>
      </footer>
    </div>
  );
}
