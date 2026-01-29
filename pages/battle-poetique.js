"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Trophy, Loader2, BookOpen, PenTool, Eye, Heart, Share2, ArrowRight, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export default function BattlePoetique() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- LOGIQUE DE CHARGEMENT AUTOMATIQUE ---
  const loadConcoursTexts = useCallback(async (showSilent = false) => {
    if (!showSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // Le paramètre t=Date.now() force GitHub à donner la version la plus récente (pas de cache)
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      const files = await res.json();
      
      if (Array.isArray(files)) {
        const promises = files
          .filter(f => f.name.endsWith('.json'))
          .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
        
        const data = await Promise.all(promises);
        
        const filtered = data
          .filter(item => item.isConcours === true || item.isConcours === "true")
          .sort((a, b) => new Date(b.date) - new Date(a.date));
            
        setTexts(filtered);
      }
    } catch (e) { 
      console.error("Erreur de mise à jour:", e); 
    } finally { 
      setLoading(false); 
      setIsRefreshing(false);
    }
  }, []);

  // 1. Chargement initial
  useEffect(() => {
    loadConcoursTexts();
  }, [loadConcoursTexts]);

  // 2. Mise à jour automatique toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadConcoursTexts(true); // Mise à jour silencieuse en arrière-plan
    }, 60000); 
    return () => clearInterval(interval);
  }, [loadConcoursTexts]);

  const handleShare = async (e, item) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await navigator.share({
        title: item.title,
        url: `${window.location.origin}/texts/${item.id}`,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        await navigator.clipboard.writeText(`${window.location.origin}/texts/${item.id}`);
        toast.success("Lien copié !");
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronisation de l'arène...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      
      {/* HEADER AVEC NAVIGATION DYNAMIQUE */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20">
              <Trophy size={14} /> Battle Poétique
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-teal-600 animate-pulse">
                <RefreshCcw size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase">Mise à jour...</span>
              </div>
            )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-none">
            L'Arène des <br /><span className="text-teal-600">Mots</span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/bibliotheque" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <BookOpen size={16} /> Bibliothèque Générale
          </Link>
          <Link href="/publish" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/20">
            <PenTool size={16} /> Publier un texte
          </Link>
        </div>
      </header>

      {/* LISTE DES PUBLICATIONS DU CONCOURS */}
      {texts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {texts.map((item) => (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <div className="bg-white rounded-[3.5rem] overflow-hidden border border-teal-100 shadow-2xl shadow-teal-900/5 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {item.imageBase64 ? (
                    <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-800 flex items-center justify-center font-black italic text-white/10 text-5xl">Battle</div>
                  )}
                  <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-lg z-10">
                    <Share2 size={18} />
                  </button>
                </div>

                <div className="p-10 flex-grow flex flex-col">
                  <h2 className="text-3xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 tracking-tighter leading-none">
                    {item.title}
                  </h2>
                  <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 flex-grow leading-relaxed">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="font-black text-[11px] uppercase tracking-widest">ID: {item.authorName}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-black text-[11px]">
                        <Eye size={16}/> {item.views || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500 font-black text-[11px] bg-rose-50 px-3 py-1 rounded-full">
                        <Heart size={16} fill="currentColor"/> {item.likes?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-6 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
          <Trophy size={48} className="mx-auto text-slate-200" />
          <p className="font-black uppercase text-slate-400 tracking-[0.3em] text-xs">Aucun concurrent n'est encore entré</p>
          <Link href="/concours-publish" className="inline-flex items-center gap-3 bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all">
             Rejoindre le Battle <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
