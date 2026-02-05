"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, Heart, MessageCircle, Loader2, Share2, 
  Trophy, Megaphone, ShieldCheck, Sparkles, Search, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque({ initialTexts = [], initialCursor = null }) {
  const [texts, setTexts] = useState(initialTexts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Correction : Charger les données si initialTexts est vide (ex: premier rendu ou erreur ISR)
  useEffect(() => {
    if (initialTexts.length === 0) {
      const fetchInitial = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/texts?limit=10`);
          const json = await res.json();
          if (json.data) {
            setTexts(json.data);
            setCursor(json.nextCursor);
          }
        } catch (e) {
          console.error("Erreur chargement initial client:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchInitial();
    }
  }, [initialTexts]);

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/texts?limit=10&lastId=${cursor}`);
      const json = await res.json();
      if (json.data) {
        setTexts((prev) => [...prev, ...json.data]);
        setCursor(json.nextCursor);
      }
    } catch (e) {
      toast.error("Erreur lors du chargement des textes supplémentaires");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredTexts = texts.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 font-sans">
      <div className="relative mb-12 max-w-2xl mx-auto group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher un titre ou une plume..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold outline-none focus:border-teal-500/10 focus:bg-white transition-all shadow-sm" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {filteredTexts.map((item) => {
          const isConcours = item.isConcours === true || item.isConcours === "true";
          const isAdminEmail = item.authorEmail === "adm.lablitteraire7@gmail.com" || item.authorEmail === "cmo.lablitteraire7@gmail.com";
          const isAnnonce = isAdminEmail || item.authorName === "Lisible Support Team";
          const certifiedCount = Number(item.totalCertified) || 0;
          const totalViews = Number(item.views) || 0;
          const totalLikes = Number(item.totalLikes || item.likes) || 0;

          return (
            <Link href={`/texts/${item.id}`} key={item.id} className="group flex">
              <div className={`bg-white rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border transition-all duration-500 w-full flex flex-col relative ${
                isConcours ? 'border-teal-200 shadow-2xl shadow-teal-900/5' : isAnnonce ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl'
              }`}>
                <div className="h-48 sm:h-60 bg-slate-100 relative overflow-hidden">
                  {item.imageBase64 && item.imageBase64 !== "exists" ? (
                    <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-black italic text-2xl sm:text-4xl ${isConcours ? 'bg-gradient-to-br from-teal-500 to-teal-800 text-white/20' : 'bg-slate-50 text-slate-200'}`}>
                      {isConcours ? "BATTLE" : "LISIBLE."}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 z-20">
                      {isConcours ? (
                          <div className="bg-teal-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-lg animate-in zoom-in">
                              <Trophy size={12} className="animate-bounce" />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Concours</span>
                          </div>
                      ) : isAnnonce ? (
                          <div className="bg-amber-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 shadow-lg">
                              <Megaphone size={12} />
                              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Annonce</span>
                          </div>
                      ) : (
                          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                              <span className="text-[8px] sm:text-[9px] font-black text-slate-900 uppercase tracking-widest">
                              {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                              </span>
                          </div>
                      )}
                  </div>
                  <button onClick={(e) => handleShare(e, item)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-slate-900/80 hover:bg-teal-600 text-white backdrop-blur-md rounded-xl sm:rounded-2xl transition-all z-20">
                    <Share2 size={16} />
                  </button>
                </div>

                <div className="p-6 sm:p-8 flex-grow flex flex-col">
                  <h2 className={`text-2xl sm:text-3xl font-black italic mb-3 tracking-tighter leading-tight transition-colors ${isConcours ? 'text-teal-700' : isAnnonce ? 'text-amber-900' : 'text-slate-900 group-hover:text-teal-600'}`}>
                    {item.title}
                  </h2>
                  <div className="mb-4 flex items-center gap-2">
                     <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${certifiedCount > 0 ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <Sparkles size={10} className={certifiedCount > 0 ? "animate-pulse" : ""} />
                        <span>{certifiedCount} Li {certifiedCount > 1 ? "Gagnés" : "Gagné"}</span>
                     </div>
                  </div>
                  <p className="text-slate-500 line-clamp-2 sm:line-clamp-3 font-serif italic mb-8 text-base sm:text-lg leading-relaxed">
                    {item.content?.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2 max-w-[50%] overflow-hidden">
                      <div className={`w-2 h-2 shrink-0 rounded-full ${isConcours ? 'bg-teal-500 animate-ping' : isAnnonce ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      <span className={`font-black text-[9px] sm:text-[10px] uppercase tracking-widest truncate ${isConcours ? 'text-teal-600' : isAnnonce ? 'text-amber-700' : 'text-slate-500'}`}>
                        @{item.authorName}
                      </span>
                    </div>
                    <div className="flex gap-3 sm:gap-4 text-slate-400 font-black text-[10px] sm:text-[11px]">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 sm:px-3 py-1 rounded-lg"><Eye size={14}/> {totalViews}</span>
                      <span className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg ${totalLikes > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50"}`}><Heart size={14} fill={totalLikes > 0 ? "currentColor" : "none"}/> {totalLikes}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {cursor && searchTerm === "" && (
        <div className="mt-16 flex justify-center">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
            {loading ? "Chargement..." : "Charger plus d'œuvres"}
          </button>
        </div>
      )}

      {filteredTexts.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-slate-300 font-black uppercase tracking-widest">Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  try {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/index.json`);
    if (res.ok) {
      const file = await res.json();
      const allTexts = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
      const initial = allTexts.slice(0, 10);
      return {
        props: { 
          initialTexts: initial,
          initialCursor: allTexts.length > 10 ? initial[9].id : null
        },
        revalidate: 60 
      };
    }
  } catch (e) {
    console.error("ISR Error:", e);
  }
  return { props: { initialTexts: [], initialCursor: null }, revalidate: 10 };
}
