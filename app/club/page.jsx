"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, PlayCircle, PlusCircle, Mic, Video } from "lucide-react";
import ReplayCard from "@/components/ReplayCard";

export default function ClubExplorer() {
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/github-db?type=all-lives');
      const data = await res.json();
      setLives(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const activeLives = lives.filter(l => l.isActive);
  const pastReplays = lives.filter(l => !l.isActive).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-serif italic text-white mb-2">Lisible Club</h1>
            <p className="text-slate-400 text-sm font-medium">Salons littéraires et artistiques en temps réel.</p>
          </div>
          <Link href="/club/dashboard">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-blue-600/20">
              <PlusCircle size={18}/> Créer mon salon
            </button>
          </Link>
        </div>

        {/* SECTION : EN DIRECT */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">En direct du Club</h2>
          </div>

          {activeLives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeLives.map((live) => (
                <Link href={`/club/live/${live.id}`} key={live.id}>
                  <div className="group bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden">
                    <div className="flex items-center gap-5 mb-6">
                      <img src={live.hostAvatar} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/5" />
                      <div>
                        <h4 className="text-white text-lg font-bold group-hover:text-blue-400 transition-colors">{live.title}</h4>
                        <p className="text-xs text-slate-500">avec {live.hostName}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                       <span className="text-[10px] font-black text-blue-400 flex items-center gap-2">
                         {live.type === 'audio' ? <Mic size={14}/> : <Video size={14}/>} {live.type.toUpperCase()}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rejoindre →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-slate-900/20 rounded-[3rem] border border-dashed border-white/5">
              <p className="text-slate-500 font-serif italic text-lg">Aucun salon n'est ouvert pour le moment...</p>
            </div>
          )}
        </section>

        {/* SECTION : REPLAYS */}
        <section>
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-tighter mb-8">Archives récentes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pastReplays.map(replay => <ReplayCard key={replay.id} replay={replay} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
