"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Eye, Heart, Loader2, Trophy, ShieldCheck, 
  Search, ChevronDown, Sparkles, Megaphone
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque({ initialTexts = [] }) {
  const [texts, setTexts] = useState(initialTexts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [activeGenre, setActiveGenre] = useState("Tous");
  const genres = ["Tous", "Poésie", "Nouvelle", "Roman", "Chronique", "Essai", "Battle Poétique"];

  useEffect(() => {
    if (texts.length === 0) fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/github-db?type=library`);
      const json = await res.json();
      if (json && json.content) {
        setTexts(json.content);
      }
    } catch (e) { 
      console.error(e); 
      toast.error("Le Grand Livre des manuscrits est inaccessible.");
    } finally { 
      setLoading(false); 
    }
  };

  const filteredTexts = useMemo(() => {
    return texts.filter(t => {
      const matchesSearch = 
        (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.author || t.authorName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = 
        activeGenre === "Tous" || 
        (t.genre === activeGenre || t.category === activeGenre);
      return matchesSearch && matchesGenre;
    });
  }, [texts, searchTerm, activeGenre]);

  if (loading && texts.length === 0) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture des archives...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 font-sans bg-[#FCFBF9] min-h-screen">
      
      <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={14} className="text-teal-600" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-teal-600">Patrimoine Littéraire</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Les Archives.</h1>
      </div>

      <div className="space-y-10 mb-20">
        <div className="relative max-w-2xl mx-auto group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rechercher une œuvre, une plume..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-[2.5rem] pl-16 pr-8 py-7 text-sm font-bold outline-none focus:border-teal-500/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-7 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                activeGenre === g
                  ? "bg-slate-950 border-slate-950 text-white shadow-xl scale-105"
                  : "bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600 shadow-sm"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
        {filteredTexts.map((item) => {
          const isDuel = item.isConcours === true || item.category === "Battle Poétique" || item.genre === "Battle Poétique";
          const isAnnouncementAccount = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"].includes(item.authorEmail);
          const isOtherAdmin = ["jb7management@gmail.com"].includes(item.authorEmail);

          return (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <article className={`h-full bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 flex flex-col relative ${
                isDuel ? "border-teal-100 shadow-teal-900/5" : "border-slate-50 shadow-slate-200/50"
              } hover:-translate-y-2 hover:shadow-2xl hover:border-teal-500/10`}>
                
                <div className="h-64 bg-slate-100 relative overflow-hidden">
                  <img
                    src={item.image || item.imageBase64 || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1457369804593-54844a3964ad?q=80&w=800"; }}
                  />
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {isDuel && (
                      <span className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <Trophy size={12} /> Duel de Plume
                      </span>
                    )}
                    {isAnnouncementAccount ? (
                      <span className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <Megaphone size={12} /> Annonce
                      </span>
                    ) : isOtherAdmin && (
                      <span className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                        <ShieldCheck size={12} /> Officiel
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-10 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      {item.category || item.genre || "Écrit"}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-300 tracking-tighter">
                      {item.date ? new Date(item.date).getFullYear() : "2026"}
                    </span>
                  </div>

                  <h2 className="text-3xl font-black italic mb-4 tracking-tighter leading-none text-slate-900 group-hover:text-teal-600 transition-colors">
                    {item.title}
                  </h2>

                  <p className="text-slate-500 line-clamp-3 font-serif italic mb-10 text-[17px] leading-relaxed">
                    {item.summary || "Un nouveau manuscrit scellé dans les registres de l'Atelier..."}
                  </p>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-[12px] font-black border-4 border-slate-50">
                        {(item.author || item.authorName || "L").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">
                          {item.author || item.authorName}
                        </span>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Auteur Scellé</span>
                      </div>
                    </div>
                    
                    {/* Masquer les stats pour les comptes Annonce */}
                    {!isAnnouncementAccount && (
                      <div className="flex gap-5 text-slate-300 text-[11px] font-black">
                        <span className="flex items-center gap-2"><Eye size={18} /> {item.views || 0}</span>
                        <span className="flex items-center gap-2"><Heart size={18} /> {item.likes || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {filteredTexts.length === 0 && !loading && (
        <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 mt-20">
           <Search className="text-slate-100 mx-auto mb-6" size={64} />
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-sm mx-auto">
             Aucun manuscrit n'a été trouvé dans ce compartiment des archives.
           </p>
        </div>
      )}
    </div>
  );
}
