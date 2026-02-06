"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, Heart, MessageCircle, Loader2, Share2, 
  Trophy, Megaphone, ShieldCheck, Sparkles, Search, ChevronDown 
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque() {
  // Changement : On initialise à vide et on charge au montage pour simplifier la cohabitation
  const [texts, setTexts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true); // True au départ pour le chargement initial
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      // Appel à votre API (qui est soit dans pages/api, soit migrée dans app/api)
      const res = await fetch(`/api/texts?limit=12`);
      const json = await res.json();
      if (json.data) {
        setTexts(json.data);
        setCursor(json.nextCursor);
      }
    } catch (e) {
      console.error("Erreur chargement initial:", e);
      toast.error("Impossible de charger la bibliothèque");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/texts?limit=12&lastId=${cursor}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setTexts((prev) => [...prev, ...json.data]);
        setCursor(json.nextCursor);
      } else {
        setCursor(null);
      }
    } catch (e) {
      toast.error("Fin de la collection ou erreur de connexion");
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
        toast.success("Lien copié !");
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 font-sans min-h-screen">
      {/* Recherche */}
      <div className="relative mb-12 max-w-2xl mx-auto group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Rechercher une œuvre ou un auteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold outline-none focus:border-teal-500/20 focus:bg-white focus:shadow-xl transition-all"
        />
      </div>

      {loading && texts.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {filteredTexts.map((item) => {
            const isConcours =
              item.isConcours === true ||
              item.isConcours === "true" ||
              item.genre === "Battle Poétique";

            const isAdmin = [
              "adm.lablitteraire7@gmail.com",
              "jb7management@gmail.com"
            ].includes(item.authorEmail);

            return (
              <Link href={`/texts/${item.id}`} key={item.id} className="group flex">
                <div className={`bg-white rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border transition-all duration-500 w-full flex flex-col relative ${
                  isConcours
                    ? "border-teal-100 shadow-2xl shadow-teal-900/5 hover:border-teal-300"
                    : "border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-slate-200"
                }`}>

                  {/* Image */}
                  <div className="h-48 sm:h-60 bg-slate-50 relative overflow-hidden">
                    {item.image || item.hasImage ? (
                      <img
                        src={item.imageBase64 || `https://lisible.biz/api/placeholder/${item.id}`}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1457369804593-54844a3964ad?q=80&w=800&auto=format&fit=crop";
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-black italic text-2xl ${
                        isConcours ? "bg-teal-50 text-teal-200" : "bg-slate-50 text-slate-100"
                      }`}>
                        {isConcours ? "BATTLE" : "LISIBLE"}
                      </div>
                    )}

                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {isConcours && (
                        <div className="bg-teal-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                          <Trophy size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Arène</span>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="bg-amber-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                          <ShieldCheck size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Staff</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleShare(e, item)}
                      className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-teal-600 hover:text-white backdrop-blur-md rounded-xl transition-all shadow-sm"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Texte */}
                  <div className="p-7 sm:p-9 flex-grow flex flex-col">
                    <h2 className="text-2xl sm:text-3xl font-black italic mb-3 tracking-tighter leading-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                      {item.title}
                    </h2>

                    <div className="mb-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span className="bg-slate-50 px-2 py-1 rounded-md">
                        {item.genre || "Littérature"}
                      </span>
                      <span>•</span>
                      <span>
                        {item.date
                          ? new Date(item.date).toLocaleDateString("fr-FR")
                          : "Récemment"}
                      </span>
                    </div>

                    <p className="text-slate-500 line-clamp-2 font-serif italic mb-8 text-base leading-relaxed">
                      {item.content?.replace(/<[^>]*>/g, "") || "Découvrir cette plume..."}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 border border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-teal-700">
                          {item.authorName?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">
                          {item.authorName}
                        </span>
                      </div>
                      <div className="flex gap-4 text-slate-400 font-black text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <Eye size={14} /> {item.views || 0}
                        </span>
                        <span className={`flex items-center gap-1.5 ${item.totalLikes > 0 ? "text-rose-500" : ""}`}>
                          <Heart size={14} fill={item.totalLikes > 0 ? "currentColor" : "none"} />
                          {item.totalLikes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {cursor && searchTerm === "" && (
        <div className="mt-16 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
            Explorer plus
          </button>
        </div>
      )}
    </div>
  );
}
