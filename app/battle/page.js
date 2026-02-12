"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Loader2, BookOpen, PenTool, Eye, 
  Heart, Share2, ArrowRight, RefreshCcw, Zap, Coins, Sparkles, AlignLeft
} from "lucide-react";
import { toast } from "sonner";

export default function BattlePoetique() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Logique de tri modifiée : Certifications > Likes > Date
  const sortBattleTexts = useCallback((data) => {
    return data
      .filter(item => item.isConcours === true || item.isConcours === "true" || item.genre === "Battle Poétique")
      .sort((a, b) => {
        // Priorité 1 : Certifications
        const certA = Number(a.totalCertified || a.certified || 0);
        const certB = Number(b.totalCertified || b.certified || 0);
        if (certB !== certA) return certB - certA;
        
        // Priorité 2 : Likes
        const likesA = Number(a.totalLikes || a.likes || 0);
        const likesB = Number(b.totalLikes || b.likes || 0);
        if (likesB !== likesA) return likesB - likesA;
        
        // Priorité 3 : Date
        return new Date(b.date) - new Date(a.date);
      });
  }, []);

  const loadConcoursTexts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/github-db?type=library&t=${Date.now()}`); 
      const json = await res.json();
      
      if (json.content && Array.isArray(json.content)) {
        setTexts(sortBattleTexts(json.content));
      }
    } catch (e) { 
      console.error("Erreur Arène:", e); 
    } finally { 
      setLoading(false); 
      setIsRefreshing(false);
    }
  }, [sortBattleTexts]);

  useEffect(() => {
    loadConcoursTexts();
  }, [loadConcoursTexts]);

  useEffect(() => {
    const interval = setInterval(() => loadConcoursTexts(true), 60000); 
    return () => clearInterval(interval);
  }, [loadConcoursTexts]);

  const handleShare = async (e, item) => {
    e.preventDefault(); 
    e.stopPropagation();
    const url = `${window.location.origin}/texts/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ 
            title: `Votez pour "${item.title}" dans la Battle Lisible !`, 
            url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien de vote copié !");
      }
    } catch (err) { /* Annulé */ }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FCFBF9] gap-6">
      <div className="relative">
        <Loader2 className="animate-spin text-teal-600" size={50}/>
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-200" size={20} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">
        Calcul des rangs de l'Arène...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] font-sans pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-100 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl border border-slate-700">
                <Trophy size={14} className="text-amber-400 fill-amber-400" /> Battle Saison 1
              </div>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-teal-600 animate-in fade-in">
                  <RefreshCcw size={12} className="animate-spin" />
                  <span className="text-[9px] font-black uppercase">Live Update</span>
                </div>
              )}
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.85]">
              L'Arène <br /><span className="text-teal-600">Sacrée.</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md leading-relaxed text-sm">
              Ici, les mots s'affrontent. Sans artifices visuels, seule la force du verbe compte.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/library" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <BookOpen size={16} /> Archives
            </Link>
            <Link href="/battle/close" className="flex items-center gap-3 bg-teal-600 text-white px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-teal-600/30">
              <PenTool size={18} /> Déposer un défi
            </Link>
          </div>
        </header>

        <main className="mt-20">
          {texts.length > 0 ? (
            <div className="grid gap-12 md:grid-cols-2">
              {texts.map((item, index) => {
                const liPoints = Number(item.totalCertified || item.certified || 0);
                // Le leader est le 1er du tri s'il a au moins 1 certification
                const isLeader = index === 0 && liPoints > 0;
                const totalLikes = Number(item.totalLikes || item.likes || 0);
                
                return (
                  <Link href={`/texts/${item.id}`} key={item.id} className="group relative">
                    <div className={`bg-white rounded-[4rem] overflow-hidden border transition-all duration-700 flex flex-col h-full ${
                      isLeader 
                      ? "border-amber-200 shadow-[0_30px_60px_-15px_rgba(245,158,11,0.15)] ring-2 ring-amber-100 ring-offset-8" 
                      : "border-slate-100 shadow-xl shadow-slate-200/40 hover:border-teal-200"
                    }`}>
                      
                      {isLeader && (
                        <div className="absolute -top-4 -left-4 z-40 rotate-[-12deg] bg-amber-400 text-slate-900 px-6 py-2 rounded-xl shadow-xl border-2 border-white flex items-center gap-2">
                          <Sparkles size={14} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Légende d'Arène</span>
                        </div>
                      )}

                      <div className={`p-8 flex justify-between items-center ${isLeader ? 'bg-amber-50/50' : 'bg-slate-50/30'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isLeader ? 'bg-amber-400 text-white' : 'bg-slate-900 text-white'}`}>
                             {index + 1}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position actuelle</span>
                        </div>
                        <button onClick={(e) => handleShare(e, item)} className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-slate-100">
                          <Share2 size={18} />
                        </button>
                      </div>

                      <div className="p-12 flex-grow flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                           <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">
                             <AlignLeft size={10} className="inline mr-1" /> {item.category || "Battle"}
                           </span>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                             {item.authorName || 'Anonyme'}
                           </span>
                        </div>

                        <h2 className="text-4xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-6 tracking-tighter leading-[0.85]">
                          {item.title}
                        </h2>
                        
                        <p className="text-slate-500 line-clamp-4 font-serif italic mb-10 text-lg leading-relaxed flex-grow">
                          {item.content?.replace(/<[^>]*>/g, '').substring(0, 300)}...
                        </p>
                        
                        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-[12px] transition-all border ${
                            liPoints > 0 
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-inner" 
                            : "bg-slate-50 border-slate-100 text-slate-300"
                          }`}>
                            <Coins size={16} className={liPoints > 0 ? "animate-pulse" : ""}/> 
                            {liPoints} <span className="text-[9px] opacity-60">LI GAGNÉS</span>
                          </div>

                          <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-slate-400 font-black text-[11px]">
                              <Eye size={18} className="text-slate-200"/> {item.views || 0}
                            </div>
                            <div className={`flex items-center gap-2 font-black text-[12px] ${totalLikes > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                              <Heart size={20} fill={totalLikes > 0 ? "currentColor" : "none"} className="group-hover:scale-125 transition-transform duration-300"/> {totalLikes}
                            </div>
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
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                 <Zap size={40} className="text-slate-200" />
              </div>
              <div className="space-y-3">
                <h3 className="font-black uppercase text-slate-900 tracking-[0.3em] text-lg">L'arène est vide</h3>
                <p className="text-slate-400 text-sm font-medium">Les gladiateurs de la plume ne sont pas encore arrivés.</p>
              </div>
              <Link href="/publier-battle" className="inline-flex items-center gap-3 bg-slate-900 text-white px-12 py-6 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-2xl">
                 Lancer le premier défi <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-32 text-center pb-10">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 flex items-center justify-center gap-4">
           <span className="w-8 h-px bg-slate-100"></span>
           Arène Officielle • {new Date().getFullYear()}
           <span className="w-8 h-px bg-slate-100"></span>
         </p>
      </footer>
    </div>
  );
}
