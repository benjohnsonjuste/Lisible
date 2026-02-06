"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Loader2, BookOpen, PenTool, Eye, 
  Heart, Share2, ArrowRight, RefreshCcw, Zap, Coins
} from "lucide-react";
import { toast } from "sonner";

export default function BattlePoetique() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fonction de tri unifiée pour le leaderboard
  const sortBattleTexts = (data) => {
    return data
      .filter(item => item.isConcours === true || item.isConcours === "true")
      .sort((a, b) => {
        const likesA = Number(a.totalLikes || a.likes || 0);
        const likesB = Number(b.totalLikes || b.likes || 0);
        if (likesB !== likesA) return likesB - likesA;
        
        const certA = Number(a.totalCertified || 0);
        const certB = Number(b.totalCertified || 0);
        if (certB !== certA) return certB - certA;
        
        return new Date(b.date) - new Date(a.date);
      });
  };

  const loadConcoursTexts = useCallback(async (showSilent = false) => {
    if (!showSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // Appel vers ton API route (app/api/texts/route.js)
      const res = await fetch(`/api/texts?limit=1000&t=${Date.now()}`); 
      const json = await res.json();
      
      if (json.data && Array.isArray(json.data)) {
        const sorted = sortBattleTexts(json.data);
        setTexts(sorted);
      }
    } catch (e) { 
      console.error("Erreur de mise à jour de l'arène:", e); 
    } finally { 
      setLoading(false); 
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConcoursTexts();
  }, [loadConcoursTexts]);

  // Auto-refresh toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadConcoursTexts(true);
    }, 60000); 
    return () => clearInterval(interval);
  }, [loadConcoursTexts]);

  const handleShare = async (e, item) => {
    e.preventDefault(); 
    e.stopPropagation();
    const url = `${window.location.origin}/texts/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ 
            title: `Votez pour mon texte "${item.title}" dans la Battle Lisible !`, 
            url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien de la Battle copié !");
      }
    } catch (err) {
      console.log("Partage annulé");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4 font-sans bg-[#FCFBF9] min-h-screen">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Synchronisation de l'Arène...
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700 font-sans bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 border border-slate-700">
              <Trophy size={14} className="text-amber-400 animate-pulse" /> Battle Poétique
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-teal-600">
                <RefreshCcw size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Calcul des scores...</span>
              </div>
            )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none">
            L'Arène des <br /><span className="text-teal-600">Mots</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/bibliotheque" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <BookOpen size={16} /> Bibliothèque
          </Link>
          <Link href="/publier?concours=true" className="flex items-center gap-2 bg-teal-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-teal-600/20">
            <PenTool size={16} /> Entrer dans la Battle
          </Link>
        </div>
      </header>

      {texts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {texts.map((item, index) => {
            const isLeader = index === 0;
            const certifiedCount = Number(item.totalCertified || 0);
            const totalLikes = Number(item.totalLikes || item.likes || 0);
            
            return (
              <Link href={`/texts/${item.id}`} key={item.id} className="group">
                <div className={`bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative ${
                  isLeader ? "border-amber-200 shadow-2xl shadow-amber-900/10" : "border-slate-100 shadow-xl shadow-slate-200/50 hover:border-teal-200"
                }`}>
                  
                  {isLeader && (
                    <div className="absolute top-0 right-10 z-30">
                      <div className="bg-amber-400 text-slate-900 px-4 py-6 rounded-b-2xl shadow-xl flex flex-col items-center gap-1">
                        <Trophy size={20} />
                        <span className="text-[8px] font-black uppercase">Leader</span>
                      </div>
                    </div>
                  )}

                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    {item.imageBase64 && item.imageBase64 !== "exists" ? (
                      <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        isLeader ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900'
                      }`}>
                         <Zap size={60} className="text-white/20 -rotate-12 animate-pulse" />
                      </div>
                    )}
                    
                    <button onClick={(e) => handleShare(e, item)} className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-lg z-10">
                      <Share2 size={18} />
                    </button>

                    <div className="absolute bottom-6 left-6 flex gap-2">
                      <div className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] border border-white/10">
                        Concurrent #{item.concurrentId || (index + 1)}
                      </div>
                    </div>
                  </div>

                  <div className="p-10 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                       <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{item.genre || "Candidat"}</span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {item.date ? new Date(item.date).toLocaleDateString() : "Battle en cours"}
                       </span>
                    </div>

                    <h2 className="text-3xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 tracking-tighter leading-[0.9]">
                      {item.title}
                    </h2>
                    
                    <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 flex-grow leading-relaxed">
                      {item.content?.replace(/<[^>]*>/g, '')}
                    </p>
                    
                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[11px] transition-all border ${
                          certifiedCount > 0 
                          ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" 
                          : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}>
                          <Coins size={14} className={certifiedCount > 0 ? "animate-pulse" : ""}/> 
                          {certifiedCount * 50} <span className="text-[8px] opacity-70 ml-1">LI</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 font-black text-[11px]">
                          <Eye size={16} className="text-slate-300"/> {item.views || 0}
                        </div>
                        <div className={`flex items-center gap-1.5 font-black text-[11px] px-4 py-2 rounded-2xl ${totalLikes > 0 ? 'bg-rose-50 text-rose-500' : 'text-slate-300'}`}>
                          <Heart size={16} fill={totalLikes > 0 ? "currentColor" : "none"} className="group-hover:scale-125 transition-transform"/> {totalLikes}
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
        <div className="py-32 text-center space-y-8 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 font-sans">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
             <Trophy size={40} className="text-slate-200" />
          </div>
          <div className="space-y-2">
            <p className="font-black uppercase text-slate-900 tracking-[0.2em] text-sm">L'arène est vide</p>
            <p className="text-slate-400 text-xs font-medium">Les poètes fourbissent leurs armes.</p>
          </div>
          <Link href="/publier?concours=true" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-2xl">
             Lancer le défi <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <footer className="pt-20 text-center border-t border-slate-100">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
           Lisible.biz • Arène Officielle • {new Date().getFullYear()}
         </p>
      </footer>
    </div>
  );
}
