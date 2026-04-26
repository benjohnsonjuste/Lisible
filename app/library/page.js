"use client";
import React, { useEffect, useState } from "react";
import { 
  BookOpen, Search, Loader2, Eye, Heart, ArrowRight, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from 'next/head';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
};

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadLibraryData();
  }, []);

  async function loadLibraryData() {
    try {
      // 1. Récupérer tous les fichiers de publications
      const pubUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications`;
      const pubRes = await fetch(pubUrl);
      if (!pubRes.ok) throw new Error("Impossible de charger les textes");
      
      const pubFiles = await pubRes.json();
      
      // 2. Récupérer les données de chaque texte + Données auteurs
      const allData = await Promise.all(
        pubFiles
          .filter(f => f.name.endsWith('.json'))
          .map(async (file) => {
            const res = await fetch(file.download_url);
            const data = await res.json();
            
            // On essaie de récupérer l'avatar de l'auteur via son email
            const authorEmail = data.authorEmail?.toLowerCase().trim();
            const authorImg = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${authorEmail}`;
            
            return {
              id: file.name.replace('.json', ''),
              title: data.title || "Titre inconnu",
              authorName: data.authorName || "Plume Anonyme",
              authorEmail: authorEmail,
              content: data.content,
              views: Number(data.views || 0),
              li: Number(data.li || 0),
              category: data.category || "Littérature",
              image: authorImg,
              date: data.date
            };
          })
      );

      // Trier par les plus récents ou les plus vus
      setTexts(allData.sort((a, b) => b.views - a.views));
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement de la bibliothèque.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;
  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  const filteredTexts = texts.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.authorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <Head><title>Bibliothèque | Lisible</title></Head>

      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <div>
          <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Lisible.</h1>
          <p className="mt-6 text-slate-400 font-bold uppercase tracking-[0.2em] text-xs ml-2">Explorer la bibliothèque</p>
        </div>
        <div className="relative group w-full lg:w-96 self-end">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un texte ou un auteur..." 
            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTexts.map((text) => (
          <Link href={`/texts/${text.id}`} key={text.id} className="group">
            <div className="h-full bg-white rounded-[3.5rem] p-8 border border-slate-100 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden">
              
              {/* Badge Catégorie */}
              <div className="absolute top-6 right-8">
                <span className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Sparkles size={10} className="text-teal-400" /> {text.category}
                </span>
              </div>

              <div className="space-y-6">
                {/* Header du texte */}
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md">
                      <img src={text.image} alt={text.authorName} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-teal-600 tracking-wider leading-none">{text.authorName}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{text.date || "Récemment"}</p>
                   </div>
                </div>

                {/* Titre */}
                <h2 className="text-2xl font-black italic text-slate-900 tracking-tight leading-tight group-hover:text-teal-600 transition-colors">
                  {text.title}
                </h2>
              </div>

              {/* Stats & Footer */}
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Eye size={14} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-900">{text.views}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart size={13} className="text-rose-500" fill="currentColor" />
                    <span className="text-xs font-black text-slate-900">{text.li}</span>
                  </div>
                </div>
                
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredTexts.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="mx-auto text-slate-200 mb-4" size={64} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucun texte trouvé dans la collection.</p>
        </div>
      )}
    </div>
  );
}
