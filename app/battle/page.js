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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FCFBF9] gap-6 px-4 text-center">
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
    <div className="min-h-screen bg-[#FCFBF9] font-sans pb-20 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-slate-100 pb-12 md:pb-16">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 sm:px-5 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-2xl border border-slate-700">
                <Trophy size={14} className="text-amber-400 fill-amber-400" /> Battle Poétique Saison 2
              </div>
              {isRefreshing && (
                <div className="flex items-center gap-2 text-teal-600 animate-in fade-in">
                  <RefreshCcw size={12} className="animate-spin" />
                  <span className="text-[9px] font-black uppercase">Live Update</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.85]">
              L'Arène <br /><span className="text-teal-600">Sacrée.</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md leading-relaxed text-xs sm:text-sm">
              Ici, les mots s'affrontent. Sans artifices visuels, seule la force du verbe compte.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/library" className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <BookOpen size={16} /> Archives
            </Link>
            <Link href="/battle/close" className="flex items-center justify-center gap-3 bg-teal-600 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-teal-600/30">
              <PenTool size={18} /> Déposer un défi
            </Link>
          </div>
        </header>

        <main className="mt-12 md:mt-20">
          {texts.length > 0 ? (
            <div className="grid gap-8 md:gap-12 md:grid-cols-2 lg:grid-cols-2">
              {texts.map((item, index) => {
                const liPoints = Number(item.totalCertified || item.certified || 0);
                const isLeader = index === 0 && liPoints > 0;
                
                const displayViews = item.views || item.totalViews || 0;
                const displayLikes = item.likes || item.totalLikes || 0;
                
                return (
                  <Link href={`/texts/${item.id}`} key={item.id} className="group relative w-full">
                    <div className={`bg-white rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden border transition-all duration-700 flex flex-col h-full ${
                      isLeader 
                      ? "border-amber-200 shadow-[0_30px_60px_-15px_rgba(245,158,11,0.15)] ring-2 ring-amber-100 ring-offset-4 sm:ring-offset-8" 
                      : "border-slate-100 shadow-xl shadow-slate-200/40 hover:border-teal-200"
                    }`}>
                      
                      {isLeader && (
                        <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 z-40 rotate-[-12deg] bg-amber-400 text-slate-900 px-4 sm:px-6 py-2 rounded-xl shadow-xl border-2 border-white flex items-center gap-2">
                          <Sparkles size={14} className="animate-pulse" />
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Légende d'Arène</span>
                        </div>
                      )}

                      <div className={`p-6 sm:p-8 flex justify-between items-center ${isLeader ? 'bg-amber-50/50' : 'bg-slate-50/30'}`}>
                        <div className="flex items-center gap-3 sm:gap-4">
                           <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-sm sm:text-lg ${isLeader ? 'bg-amber-400 text-white' : 'bg-slate-900 text-white'}`}>
                             {index + 1}
                           </div>
                           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Position</span>
                        </div>
                        <button onClick={(e) => handleShare(e, item)} className="p-3 sm:p-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-slate-100">
                          <Share2 size={18} />
                        </button>
                      </div>

                      <div className="p-8 sm:p-12 flex-grow flex flex-col">
                        <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
                           <span className="text-[8px] sm:text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">
                             <AlignLeft size={10} className="inline mr-1" /> {item.category || item.genre || "Battle"}
                           </span>
                           <span className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[150px]">
                             {item.author || item.authorName || 'Anonyme'}
                           </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 sm:mb-6 tracking-tighter leading-tight sm:leading-[0.85]">
                          {item.title}
                        </h2>
                        
                        <p className="text-slate-500 line-clamp-4 font-serif italic mb-8 sm:mb-10 text-sm sm:text-lg leading-relaxed flex-grow">
                          {item.content?.replace(/<[^>]*>/g, '').substring(0, 300)}...
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between pt-6 sm:pt-8 border-t border-slate-50">
                          <div className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl font-black text-[10px] sm:text-[12px] transition-all border ${
                            liPoints > 0 
                            ? "bg-amber-50 border-amber-200 text-amber-600 shadow-inner" 
                            : "bg-slate-50 border-slate-100 text-slate-300"
                          }`}>
                            <Coins size={16} className={liPoints > 0 ? "animate-pulse" : ""}/> 
                            {liPoints} <span className="text-[8px] sm:text-[9px] opacity-60 ml-1 uppercase">Li Gagnés</span>
                          </div>

                          <div className="flex justify-center sm:justify-end gap-6">
                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] sm:text-[11px]">
                              <Eye size={18} className="text-slate-200"/> {displayViews}
                            </div>
                            <div className={`flex items-center gap-2 font-black text-[11px] sm:text-[12px] ${displayLikes > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                              <Heart size={20} fill={displayLikes > 0 ? "currentColor" : "none"} className="group-hover:scale-125 transition-transform duration-300"/> {displayLikes}
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
            <div className="py-24 sm:py-40 px-4 text-center space-y-10 bg-white rounded-[3rem] sm:rounded-[5rem] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto">
                 <Zap size={30} className="text-slate-200 sm:w-10 sm:h-10" />
              </div>
              <div className="space-y-3 px-4">
                <h3 className="font-black uppercase text-slate-900 tracking-[0.2em] sm:tracking-[0.3em] text-md sm:text-lg">L'arène est vide</h3>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Les gladiateurs de la plume ne sont pas encore arrivés.</p>
              </div>
              <Link href="/publier-battle" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-2xl">
                 Lancer le défi <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-16 md:mt-32 text-center pb-10 px-4">
         <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-slate-300 flex items-center justify-center gap-2 sm:gap-4">
           <span className="w-4 sm:w-8 h-px bg-slate-100"></span>
           Arène Officielle • {new Date().getFullYear()}
           <span className="w-4 sm:w-8 h-px bg-slate-100"></span>
         </p>
      </footer>
    </div>
  );
}
