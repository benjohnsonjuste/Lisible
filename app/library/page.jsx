"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Search,
  Loader2,
  Eye,
  Heart,
  ArrowRight,
  Coins,
  AlignLeft,
  Trophy,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from "next/head";

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  // 🔥 Technique inspirée de TextContent pour récupérer les données réelles par ID
  const loadLibraryData = useCallback(async () => {
    try {
      // 1. Récupération des profils
      const usersRes = await fetch(`/api/realtime-data?folder=users`);
      const usersJson = await usersRes.json();
      const allUsers = Array.isArray(usersJson.content) ? usersJson.content : [];

      // 2. Récupération de la liste des textes
      const textsRes = await fetch(`/api/realtime-data?folder=texts`);
      const textsJson = await textsRes.json();
      const rawTexts = Array.isArray(textsJson.content) ? textsJson.content : [];

      // 3. Pour chaque texte, on va chercher les datas réelles comme dans TextContent
      const parsedTexts = await Promise.all(rawTexts.map(async (data, index) => {
        const textId = data.id || data.fileName || data.slug || `text-${index}`;
        const isNovelDuel = data.genre === "Duel Des Nouvelles" || data.category === "Duel Des Nouvelles";
        const isBattlePoetique = data.isConcours === true || ["Battle Poétique", "Battle Poétique International"].includes(data.genre || data.category);
        
        // --- INSPIRATION TEXTCONTENT : Fetch individuel pour les stats réelles ---
        let liveStats = { views: 0, likes: 0, certified: 0 };
        try {
          const fetchType = isNovelDuel ? "novel" : "text";
          const detailRes = await fetch(`https://lisible.biz/api/github-db?type=${fetchType}&id=${textId}`);
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            liveStats = detailJson.content;
          }
        } catch (err) {
          console.error(`Erreur stats pour ${textId}`, err);
        }
        // --- FIN INSPIRATION ---

        const email = (data.authorEmail || data.email || "").toLowerCase().trim();
        const userProfile = allUsers.find(
          (u) => (u.email || "").toLowerCase().trim() === email
        );

        const realImage = userProfile?.profilePic || userProfile?.image || null;

        return {
          id: textId,
          title: data.title || data.textTitle || "Texte sans titre",
          authorName: data.author || data.authorName || data.penName || "Plume Anonyme",
          
          // 🔥 Stats réelles synchronisées
          views: Number(liveStats.views || data.views || 0),
          likes: Number(liveStats.likes || data.likes || 0),
          li: Number(liveStats.certified || data.certified || 0),

          category: data.category || data.genre || "Littérature",
          image: realImage || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${email || index}`,
          isNovelDuel,
          isBattlePoetique
        };
      }));

      const sorted = parsedTexts.sort((a, b) => b.views - a.views);
      setTexts(sorted);
    } catch (e) {
      console.error(e);
      toast.error("Impossible de joindre la bibliothèque.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadLibraryData();
  }, [loadLibraryData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadLibraryData();
    }, 30000); // Refresh toutes les 30 sec pour ne pas surcharger les requêtes individuelles
    return () => clearInterval(interval);
  }, [loadLibraryData]);

  const filteredTexts = useMemo(() => {
    return texts.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [texts, searchTerm]);

  if (!mounted) return null;
  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <Head><title>Bibliothèque | Lisible</title></Head>

      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <div>
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Lisible.</h1>
          <p className="mt-6 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] ml-2">Exploration des textes</p>
        </div>
        <div className="relative group w-full lg:w-96 self-end">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rechercher un titre ou un auteur..."
            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all font-bold text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {filteredTexts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredTexts.map((text) => (
            <Link href={`/texts/${text.id}`} key={text.id} className="group">
              <div className="h-full bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                  {text.isNovelDuel ? (
                    <span className="bg-teal-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 border border-teal-400">
                      <Swords size={10} className="animate-pulse" /> Duel des Nouvelles
                    </span>
                  ) : text.isBattlePoetique ? (
                    <span className="bg-emerald-700 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2">
                      <Trophy size={10} className="animate-bounce" /> Duel de Plume
                    </span>
                  ) : (
                    <span className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2">
                      <AlignLeft size={10} className="text-teal-400" /> {text.category}
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                      <img src={text.image} alt="Auteur" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-teal-600 tracking-wider italic">{text.authorName}</p>
                  </div>
                  <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter leading-[1.1] group-hover:text-teal-600 transition-colors">{text.title}</h2>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex gap-6">
                    <div className="text-center">
                      <span className="block text-[8px] font-black uppercase text-slate-300 tracking-widest mb-2">Li</span>
                      <div className="flex items-center gap-1.5 justify-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        <Coins size={14} className="text-amber-500" />
                        <span className="text-sm font-black text-amber-700">{text.li}</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="block text-[8px] font-black uppercase text-slate-300 tracking-widest mb-2">Stats</span>
                      <div className="flex items-center gap-4 px-1">
                        <div className="flex items-center gap-1.5">
                          <Eye size={16} className="text-slate-200" />
                          <span className="text-sm font-black text-slate-900">{text.views}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Heart size={16} className={`${text.likes > 0 ? "text-rose-500 fill-rose-500" : "text-slate-200"}`} />
                          <span className="text-sm font-black text-slate-900">{text.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center group-hover:bg-teal-600 transition-all shadow-lg active:scale-95">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-40 bg-white rounded-[5rem] border-2 border-dashed border-slate-50">
          <BookOpen className="mx-auto text-slate-100 mb-6" size={80} />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Le catalogue est silencieux</p>
        </div>
      )}
    </div>
  );
}

