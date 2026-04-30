"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Loader2, BookOpen, PenTool, Eye, 
  Heart, Share2, ArrowRight, RefreshCcw, Swords, Coins, Sparkles, Feather
} from "lucide-react";
import { toast } from "sonner";

const GITHUB = { owner: "benjohnsonjuste", repo: "Lisible" };

export default function DuelDesNouvelles() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortDuelTexts = useCallback((data) => {
    return data
      .filter(i => 
        i.isConcours === "Duel Des Nouvelles" || 
        i.genre === "Duel Des Nouvelles" || 
        i.category === "Duel Des Nouvelles"
      )
      .sort((a, b) => {
        const certA = Number(a.certified || a.totalCertified || 0), certB = Number(b.certified || b.totalCertified || 0);
        if (certB !== certA) return certB - certA;
        const likesA = Number(a.likes || a.totalLikes || 0), likesB = Number(b.likes || b.totalLikes || 0);
        if (likesB !== likesA) return likesB - likesA;
        return new Date(b.date || 0) - new Date(a.date || 0);
      });
  }, []);

  const loadConcoursTexts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setIsRefreshing(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/data/texts`);
      if (!res.ok) throw new Error();
      const files = await res.json();
      
      const rawList = await Promise.all(
        files.filter(f => f.name.endsWith('.json')).map(async (f) => {
          try {
            const r = await fetch(f.download_url);
            return r.ok ? await r.json() : null;
          } catch { return null; }
        })
      );

      setTexts(sortDuelTexts(rawList.filter(t => t !== null)));
    } catch (e) {
      toast.error("Impossible de rejoindre le Duel.");
    } finally { setLoading(false); setIsRefreshing(false); }
  }, [sortDuelTexts]);

  useEffect(() => { loadConcoursTexts(); }, [loadConcoursTexts]);
  useEffect(() => {
    const interval = setInterval(() => loadConcoursTexts(true), 60000); 
    return () => clearInterval(interval);
  }, [loadConcoursTexts]);

  const handleShare = async (e, item) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/texts/${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `Soutenez "${item.title}" dans le Duel !`, url });
      else { await navigator.clipboard.writeText(url); toast.success("Lien copié !"); }
    } catch (err) {}
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FCFBF9] gap-6 px-4">
      <div className="relative"><Loader2 className="animate-spin text-teal-600" size={50}/><Swords className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-200" size={20} /></div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Plaidoiries en cours...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] font-sans pb-20 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-100 pb-12 md:pb-16">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-slate-700">
                <Trophy size={14} className="text-amber-400 fill-amber-400" /> Duel Des Nouvelles • Édition I
              </div>
              {isRefreshing && <div className="flex items-center gap-2 text-teal-600 animate-pulse"><RefreshCcw size={12} className="animate-spin" /><span className="text-[9px] font-black uppercase">Direct</span></div>}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.85]">Le Salon <br /><span className="text-teal-600">des Duels.</span></h1>
            <p className="text-slate-400 font-medium max-w-md leading-relaxed text-sm">Chaque mot est une lame, chaque récit une estocade. Votez pour la plume la plus tranchante.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/library" className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"><BookOpen size={16} /> Archives</Link>
            
            {/* BOUTON PUBLIER GRISÂTRE NON CLIQUABLE */}
            <div className="flex items-center justify-center gap-3 bg-slate-200 text-slate-400 px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest cursor-not-allowed grayscale opacity-60">
              <PenTool size={18} /> Entrer dans la lice
            </div>
          </div>
        </header>

        <main className="mt-12 md:mt-20">
          {texts.length > 0 ? (
            <div className="grid gap-8 md:gap-12 md:grid-cols-2">
              {texts.map((item, index) => {
                const liPoints = Number(item.certified || item.totalCertified || 0);
                const isLeader = index === 0 && liPoints > 0;
                const authorName = item.author || item.authorName || item.penName || 'Plume Anonyme';
                
                return (
                  <Link href={`/texts/${item.id}`} key={item.id} className="group relative w-full">
                    <div className={`bg-white rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden border transition-all duration-700 flex flex-col h-full ${isLeader ? "border-amber-200 shadow-2xl ring-2 ring-amber-100" : "border-slate-100 shadow-xl shadow-slate-200/40 hover:border-teal-200"}`}>
                      {isLeader && <div className="absolute -top-3 -left-3 z-40 rotate-[-12deg] bg-amber-400 text-slate-900 px-6 py-2 rounded-xl shadow-xl border-2 border-white flex items-center gap-2"><Sparkles size={14} className="animate-pulse" /><span className="text-[10px] font-black uppercase">Premier Rang</span></div>}
                      <div className={`p-6 sm:p-8 flex justify-between items-center ${isLeader ? 'bg-amber-50/50' : 'bg-slate-50/30'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isLeader ? 'bg-amber-400 text-white' : 'bg-slate-900 text-white'}`}>{index + 1}</div>
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hiérarchie</span>
                        </div>
                        <button onClick={(e) => handleShare(e, item)} className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-slate-100"><Share2 size={18} /></button>
                      </div>
                      <div className="p-8 sm:p-12 flex-grow flex flex-col">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                           <span className="text-[9px] font-black text-teal-600 uppercase bg-teal-50 px-3 py-1 rounded-lg"><Feather size={10} className="inline mr-1" /> Duel</span>
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">{authorName}</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-6 leading-tight">{item.title}</h2>
                        <p className="text-slate-500 line-clamp-4 font-serif italic mb-10 text-lg leading-relaxed flex-grow">{item.content?.replace(/<[^>]*>/g, '').substring(0, 300) || 'Découvrir le manuscrit...'}</p>
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-8 border-t border-slate-50">
                          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-[12px] border ${liPoints > 0 ? "bg-amber-50 border-amber-200 text-amber-600 shadow-inner" : "bg-slate-50 border-slate-100 text-slate-300"}`}><Coins size={16} className={liPoints > 0 ? "animate-pulse" : ""}/> {liPoints} <span className="text-[9px] opacity-60 ml-1 uppercase">Sceaux</span></div>
                          <div className="flex gap-6 text-slate-400 font-black text-[11px]">
                            <div className="flex items-center gap-2"><Eye size={18} className="text-slate-200"/> {item.views || 0}</div>
                            <div className={`flex items-center gap-2 ${Number(item.likes) > 0 ? 'text-rose-500' : ''}`}><Heart size={20} fill={Number(item.likes) > 0 ? "currentColor" : "none"}/> {item.likes || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-40 text-center space-y-10 bg-white rounded-[5rem] border-2 border-dashed border-slate-100">
              <Swords size={30} className="text-slate-200 mx-auto" />
              <h3 className="font-black uppercase text-slate-900 tracking-[0.3em]">Aucun duel engagé</h3>
              
              {/* BOUTON CTA GRISÂTRE NON CLIQUABLE DANS L'ÉTAT VIDE */}
              <div className="inline-flex items-center gap-3 bg-slate-200 text-slate-400 px-12 py-6 rounded-3xl font-black text-[11px] uppercase tracking-widest cursor-not-allowed opacity-60">
                Publier une Nouvelle <ArrowRight size={18} />
              </div>
            </div>
          )}
        </main>
      </div>
      <footer className="mt-32 text-center pb-10"><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 flex items-center justify-center gap-4"><span className="w-8 h-px bg-slate-100"></span>Lisible • Concours Officiel • {new Date().getFullYear()}<span className="w-8 h-px bg-slate-100"></span></p></footer>
    </div>
  );
}
