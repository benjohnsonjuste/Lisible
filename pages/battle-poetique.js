"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trophy, Loader2, BookOpen, PenTool, Eye, 
  Heart, Share2, ArrowRight, RefreshCcw, Sparkles 
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
      // Le paramètre t=Date.now() force GitHub à contourner le cache
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      const files = await res.json();
      
      if (Array.isArray(files)) {
        const promises = files
          .filter(f => f.name.endsWith('.json'))
          .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
        
        const data = await Promise.all(promises);
        
        // Filtrage strict : Uniquement les textes marqués "isConcours"
        const filtered = data
          .filter(item => item.isConcours === true || item.isConcours === "true")
          .sort((a, b) => new Date(b.date) - new Date(a.date));
            
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

  // Rafraîchissement automatique toutes les 60s pour voir l'évolution des votes/certifications
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
        toast.success("Lien copié !");
      }
    } catch (err) {
      console.log("Partage annulé");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Chargement de l'Arène...
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20">
              <Trophy size={14} className="animate-bounce" /> Battle Poétique
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-teal-600">
                <RefreshCcw size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase">Actualisation...</span>
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
          <Link href="/concours-publish" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/20">
            <PenTool size={16} /> Entrer dans la Battle
          </Link>
        </div>
      </header>

      {/* LISTE DES PUBLICATIONS */}
      {texts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {texts.map((item) => (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <div className="bg-white rounded-[3.5rem] overflow-hidden border border-teal-50 shadow-2xl shadow-teal-900/5 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {item.imageBase64 ? (
                    <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-teal-900 flex items-center justify-center">
                       <Trophy size={60} className="text-white/10 -rotate-12" />
                    </div>
                  )}
                  <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-lg z-10">
                    <Share2 size={18} />
                  </button>
                  <div className="absolute bottom-4 left-6 bg-teal-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                    Candidat #{item.concurrentId || 'BATTLE'}
                  </div>
                </div>

                <div className="p-10 flex-grow flex flex-col">
                  <h2 className="text-3xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 tracking-tighter leading-none">
                    {item.title}
                  </h2>
                  <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 flex-grow leading-relaxed">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                    {/* Badge Certification (Système Li) */}
                    <div className="flex items-center gap-1.5 text-teal-600 font-black text-[11px] bg-teal-50 px-3 py-1 rounded-full">
                      <Sparkles size={14}/> {item.totalCertified || 0} Li
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-black text-[11px]">
                        <Eye size={16}/> {item.views || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500 font-black text-[11px] bg-rose-50 px-3 py-1 rounded-full">
                        <Heart size={16} fill="currentColor"/> {item.totalLikes || 0}
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
          <p className="font-black uppercase text-slate-400 tracking-[0.3em] text-xs">Le silence règne sur l'arène...</p>
          <Link href="/concours-publish" className="inline-flex items-center gap-3 bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all">
             Être le premier concurrent <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
