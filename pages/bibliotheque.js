"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, Heart, MessageCircle, Loader2, Share2, 
  Trophy, Megaphone, ShieldCheck, Sparkles 
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // t=Date.now() pour éviter le cache GitHub
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const promises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
          
          const data = await Promise.all(promises);
          // Tri par date décroissante (plus récent en haut)
          setTexts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (e) { 
        console.error("Erreur bibliothèque:", e); 
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const handleShare = async (e, item) => {
    e.preventDefault(); 
    e.stopPropagation();
    const url = `${window.location.origin}/texts/${item.id}`;
    try {
      if (navigator.share) { 
        await navigator.share({ title: item.title, url }); 
      } else { 
        await navigator.clipboard.writeText(url); 
        toast.success("Lien de l'œuvre copié !"); 
      }
    } catch (err) { 
      if (err.name !== "AbortError") toast.error("Erreur de partage"); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture des rayonnages...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-2">
      {texts.map((item) => {
        const isConcours = item.isConcours === true || item.isConcours === "true";
        const isAnnonce = item.authorEmail === "adm.lablitteraire7@gmail.com" || item.authorName === "Lisible Support Team";
        const certifiedCount = item.totalCertified || 0;

        return (
          <Link href={`/texts/${item.id}`} key={item.id} className="group relative">
            <div className={`bg-white rounded-[3rem] overflow-hidden border transition-all duration-500 h-full flex flex-col relative ${
              isConcours 
                ? 'border-teal-200 shadow-2xl shadow-teal-900/5' 
                : isAnnonce 
                  ? 'border-amber-200 bg-amber-50/10' 
                  : 'border-slate-100 shadow-xl shadow-slate-200/50'
            }`}>
              
              {/* IMAGE / HEADER CARD */}
              <div className="h-60 bg-slate-100 relative overflow-hidden">
                {item.imageBase64 ? (
                  <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-black italic text-4xl ${
                    isConcours ? 'bg-gradient-to-br from-teal-500 to-teal-800 text-white/20' : 'bg-slate-50 text-slate-200'
                  }`}>
                    {isConcours ? "BATTLE" : "LISIBLE."}
                  </div>
                )}

                {/* BADGES FLOTTANTS */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                    {isConcours ? (
                        <div className="bg-teal-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg border border-teal-400/50 animate-in zoom-in">
                            <Trophy size={12} className="animate-bounce" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Concours</span>
                        </div>
                    ) : isAnnonce ? (
                        <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                            <Megaphone size={12} />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Annonce</span>
                        </div>
                    ) : (
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>

                <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-slate-900/80 hover:bg-teal-600 text-white backdrop-blur-md rounded-2xl transition-all z-20">
                  <Share2 size={18} />
                </button>
              </div>

              {/* CONTENU CARD */}
              <div className="p-8 flex-grow flex flex-col">
                <h2 className={`text-3xl font-black italic mb-4 tracking-tighter leading-[1.1] transition-colors ${
                  isConcours ? 'text-teal-700' : isAnnonce ? 'text-amber-900' : 'text-slate-900 group-hover:text-teal-600'
                }`}>
                  {item.title}
                </h2>
                
                {/* SYSTÈME LI : Certification Stat */}
                <div className="mb-6 flex items-center gap-2">
                   <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                     certifiedCount > 0 ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                   }`}>
                      <Sparkles size={12} className={certifiedCount > 0 ? "animate-pulse" : ""} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {certifiedCount} Li {certifiedCount > 1 ? "Gagnés" : "Gagné"}
                      </span>
                   </div>
                </div>

                <p className="text-slate-500 line-clamp-3 font-serif italic mb-10 leading-relaxed text-lg">
                  {item.content}
                </p>

                {/* FOOTER CARD */}
                <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConcours ? 'bg-teal-500 animate-ping' : isAnnonce ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <span className={`font-black text-[10px] uppercase tracking-widest ${
                      isConcours ? 'text-teal-600' : isAnnonce ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      @{item.authorName}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 text-slate-400 font-black text-[11px]">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg">
                      <Eye size={14}/> {item.views || 0}
                    </span>
                    <span className="flex items-center gap-1.5 bg-rose-50 text-rose-500 px-3 py-1 rounded-lg">
                      <Heart size={14} fill={item.totalLikes > 0 ? "currentColor" : "none"}/> {item.totalLikes || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
