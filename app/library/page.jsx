"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Eye, Heart, Loader2, Share2, Trophy, ShieldCheck, 
  Sparkles, Search, ChevronDown, Filter 
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque({ initialTexts = [], initialCursor = null }) {
  const [texts, setTexts] = useState(initialTexts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Nouveaux états de filtrage ---
  const [activeGenre, setActiveGenre] = useState("Tous");
  const genres = ["Tous", "Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"];

  useEffect(() => {
    if (texts.length === 0) fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/texts?limit=12&t=${Date.now()}`);
      const json = await res.json();
      if (json.data) {
        setTexts(json.data);
        setCursor(json.nextCursor);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/texts?limit=12&lastId=${cursor}`);
      const json = await res.json();
      if (json.data?.length > 0) {
        setTexts((prev) => [...prev, ...json.data]);
        setCursor(json.nextCursor);
      } else { setCursor(null); }
    } catch (e) { toast.error("Fin des archives."); } finally { setLoading(false); }
  };

  // --- Logique de filtrage combinée ---
  const filteredTexts = useMemo(() => {
    return texts.filter(t => {
      const matchesSearch = 
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = 
        activeGenre === "Tous" || 
        (t.genre === activeGenre || t.category === activeGenre);

      return matchesSearch && matchesGenre;
    });
  }, [texts, searchTerm, activeGenre]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 font-sans">
      
      {/* Barre de Recherche & Filtres */}
      <div className="space-y-10 mb-20">
        <div className="relative max-w-2xl mx-auto group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rechercher une œuvre, une plume..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-[2.5rem] pl-16 pr-8 py-6 text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-teal-500/5 transition-all shadow-sm"
          />
        </div>

        {/* Chips de filtrage */}
        <div className="flex flex-wrap justify-center gap-3">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeGenre === g
                  ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105"
                  : "bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600 shadow-sm"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de résultats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
        {filteredTexts.map((item) => {
          const isConcours = item.isConcours === true || item.genre === "Battle Poétique";
          const isAdmin = ["adm.lablitteraire7@gmail.com", "jb7management@gmail.com"].includes(item.authorEmail);

          return (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <article className={`h-full bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 flex flex-col relative ${
                isConcours ? "border-teal-100 shadow-teal-900/5" : "border-slate-50 shadow-slate-200/50"
              } hover:-translate-y-2 hover:shadow-2xl`}>
                
                {/* Visual Header */}
                <div className="h-60 bg-slate-100 relative overflow-hidden">
                  <img
                    src={item.imageBase64 || `https://lisible.biz/api/placeholder/${item.id}`}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1457369804593-54844a3964ad?q=80&w=800"; }}
                  />
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {isConcours && (
                      <span className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <Trophy size={12} /> Duel
                      </span>
                    )}
                    {isAdmin && (
                      <span className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <ShieldCheck size={12} /> Staff
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-10 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      {item.genre || "Écrit"}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-300">
                      {item.date ? new Date(item.date).getFullYear() : "2026"}
                    </span>
                  </div>

                  <h2 className="text-3xl font-black italic mb-4 tracking-tighter leading-none text-slate-900 group-hover:text-teal-600 transition-colors">
                    {item.title}
                  </h2>

                  <p className="text-slate-500 line-clamp-2 font-serif italic mb-10 text-[17px] leading-relaxed">
                    {item.content?.replace(/<[^>]*>/g, "") || "Plonger dans l'œuvre..."}
                  </p>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black">
                        {item.authorName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                        {item.authorName}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 text-slate-300 text-[11px] font-black">
                      <span className="flex items-center gap-1.5"><Eye size={16} /> {item.views || 0}</span>
                      <span className="flex items-center gap-1.5 text-rose-500"><Heart size={16} fill="currentColor" /> {item.totalLikes || 0}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {/* Pagination Contextuelle */}
      {cursor && searchTerm === "" && activeGenre === "Tous" && (
        <div className="mt-24 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group flex items-center gap-4 px-14 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-teal-600 transition-all shadow-2xl"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Explorer plus"}
            <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
