"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, Loader2, Share2, Trophy, Megaphone } from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const promises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json()));
          
          const data = await Promise.all(promises);
          setTexts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (e) { 
        console.error(e); 
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const handleShare = async (e, item) => {
    e.preventDefault(); e.stopPropagation();
    const shareData = {
      title: item.title,
      text: `Lisez "${item.title}" sur Lisible.`,
      url: `${window.location.origin}/texts/${item.id}`,
    };
    try {
      if (navigator.share) { await navigator.share(shareData); } 
      else { await navigator.clipboard.writeText(shareData.url); toast.success("Lien copié !"); }
    } catch (err) { if (err.name !== "AbortError") toast.error("Erreur de partage"); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du rayonnage...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-2">
      {texts.map((item) => {
        // Logique des badges
        const isAnnonce = item.authorName === "Lisible Support Team";
        const isConcours = item.isConcours === true;

        return (
          <Link href={`/texts/${item.id}`} key={item.id} className="group relative">
            <div className={`bg-white rounded-[3rem] overflow-hidden border transition-all duration-500 h-full flex flex-col relative ${isAnnonce ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 shadow-xl'}`}>
              
              <div className="h-60 bg-slate-100 relative overflow-hidden">
                {item.imageBase64 ? (
                  <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-teal-50 flex items-center justify-center font-black italic text-slate-200 text-4xl">Lisible.</div>
                )}

                {/* BADGES FLOTTANTS */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm inline-block">
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>

                    {isConcours && (
                        <div className="bg-teal-600 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg animate-bounce">
                            <Trophy size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Concours</span>
                        </div>
                    )}

                    {isAnnonce && (
                        <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
                            <Megaphone size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Annonce</span>
                        </div>
                    )}
                </div>

                <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-slate-900/80 hover:bg-teal-600 text-white backdrop-blur-md rounded-2xl transition-all z-20">
                  <Share2 size={18} />
                </button>
              </div>

              <div className="p-8 flex-grow flex flex-col">
                <h2 className={`text-3xl font-black italic mb-4 tracking-tighter leading-none transition-colors ${isAnnonce ? 'text-amber-900' : 'text-slate-900 group-hover:text-teal-600'}`}>
                  {item.title}
                </h2>
                <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 leading-relaxed">
                  {item.content}
                </p>
                <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isAnnonce ? 'bg-amber-500' : 'bg-teal-500'}`} />
                    <span className={`font-black text-[10px] uppercase tracking-widest ${isAnnonce ? 'text-amber-700' : 'text-teal-600'}`}>@{item.authorName}</span>
                  </div>
                  <div className="flex gap-4 text-slate-400 font-black text-[11px]">
                    <span className="flex items-center gap-1.5"><Eye size={16}/> {item.views || 0}</span>
                    <span className="flex items-center gap-1.5"><Heart size={16}/> {item.likes?.length || 0}</span>
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
