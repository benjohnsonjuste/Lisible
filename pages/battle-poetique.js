"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Loader2, BookOpen, PenTool, Eye, 
  Heart, Share2, ArrowRight, RefreshCcw, Sparkles, Zap
} from "lucide-react";
import { toast } from "sonner";

export default function BattlePoetique() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LOGIQUE DE CHARGEMENT DYNAMIQUE ---
  const loadConcoursTexts = useCallback(async (showSilent = false) => {
    if (!showSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // Bypass du cache GitHub pour des stats en temps réel
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      const files = await res.json();
      
      if (Array.isArray(files)) {
        const promises = files
          .filter(f => f.name.endsWith('.json'))
          .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
        
        const data = await Promise.all(promises);
        
        // Filtrage Concours + Tri par impact (Certification Li puis Date)
        const filtered = data
          .filter(item => item.isConcours === true || item.isConcours === "true")
          .sort((a, b) => {
            const certA = a.totalCertified || 0;
            const certB = b.totalCertified || 0;
            if (certB !== certA) return certB - certA;
            return new Date(b.date) - new Date(a.date);
          });
            
        setTexts(filtered);
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

  // Sync automatique (toutes les 60s) pour refléter les gains Li des auteurs en direct
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
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien de la Battle copié !");
      }
    } catch (err) {
      console.log("Partage annulé");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Synchronisation de l'Arène...
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      
      {/* HEADER : L'ARÈNE DES MOTS */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20">
              <Trophy size={14} className="text-amber-400 animate-pulse" /> Battle Poétique
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-teal-600">
                <RefreshCcw size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase">Calcul des scores Li...</span>
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
          <Link href="/concours-publish" className="flex items-center gap-2 bg-teal-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-teal-600/20">
            <PenTool size={16} /> Entrer dans la Battle
          </Link>
        </div>
      </header>

      {/* LISTE DES PUBLICATIONS DE CONCOURS */}
      {texts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {texts.map((item) => {
            const hasHighLi = (item.totalCertified || 0) > 0;
            
            return (
              <Link href={`/texts/${item.id}`} key={item.id} className="group">
                <div className={`bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 flex flex-col h-full ${
                  hasHighLi ? "border-teal-100 shadow-2xl shadow-teal-600/10" : "border-slate-100 shadow-xl shadow-slate-200/50"
                }`}>
                  
                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    {item.imageBase64 ? (
                      <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
                         <Zap size={60} className="text-white/10 -rotate-12 animate-pulse" />
                      </div>
                    )}
                    
                    {/* Share Button */}
                    <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md text-slate-900 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-lg z-10">
                      <Share2 size={18} />
                    </button>

                    {/* Badge Concurrent */}
                    <div className="absolute bottom-6 left-6 flex gap-2">
                      <div className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em]">
                        Candidat #{item.concurrentId || 'BATTLE'}
                      </div>
                      {hasHighLi && (
                        <div className="bg-amber-400 text-slate-900 text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] animate-bounce">
                          Top Li
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-10 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                       <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">{item.genre || "Poésie"}</span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                    </div>

                    <h2 className="text-3xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 tracking-tighter leading-[0.9]">
                      {item.title}
                    </h2>
                    
                    <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 flex-grow leading-relaxed">
                      {item.excerpt || item.content}
                    </p>
                    
                    <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                      {/* SYSTÈME LI : Lectures Certifiées */}
                      <div className={`flex items-center gap-2 font-black text-[11px] px-4 py-2 rounded-2xl transition-all ${
                        hasHighLi 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30" 
                        : "bg-slate-50 text-slate-400"
                      }`}>
                        <Sparkles size={14} className={hasHighLi ? "animate-spin" : ""}/> 
                        {item.totalCertified || 0} <span className="text-[8px] opacity-70">LI-CERTIFIED</span>
                      </div>

                      <div className="flex gap-5">
                        <div className="flex items-center gap-1.5 text-slate-400 font-black text-[11px]">
                          <Eye size={16} className="text-slate-300"/> {item.views || 0}
                        </div>
                        <div className="flex items-center gap-1.5 text-rose-500 font-black text-[11px] bg-rose-50 px-4 py-2 rounded-2xl">
                          <Heart size={16} fill="currentColor" className="group-hover:scale-125 transition-transform"/> {item.totalLikes || 0}
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
        <div className="py-32 text-center space-y-8 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
             <Trophy size={40} className="text-slate-200" />
          </div>
          <div className="space-y-2">
            <p className="font-black uppercase text-slate-900 tracking-[0.2em] text-sm">L'arène est ouverte</p>
            <p className="text-slate-400 text-xs font-medium">En attente du premier poète pour lancer la Battle.</p>
          </div>
          <Link href="/concours-publish" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-2xl">
             Devenir le premier concurrent <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <footer className="pt-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
           Battle Poétique • Lisible.biz • Le Prestige par les mots
         </p>
      </footer>
    </div>
  );
}
