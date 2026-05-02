"use client";
import React, { useEffect, useState } from "react";
import { 
  BookOpen, Search, Loader2, Eye, Heart, ArrowRight, Sparkles, Coins, AlignLeft 
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
      // 1. Récupérer la liste des fichiers live depuis data/texts
      const textsUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/texts`;
      const res = await fetch(textsUrl);
      
      if (!res.ok) throw new Error("Accès au dossier data/texts impossible");
      
      const files = await res.json();
      
      // 2. Charger le contenu de chaque fichier JSON individuellement
      const allTexts = await Promise.all(
        files
          .filter(f => f.name.endsWith('.json'))
          .map(async (file) => {
            try {
              const textRes = await fetch(file.download_url);
              const data = await textRes.json();
              
              const email = (data.authorEmail || data.email || "").toLowerCase().trim();

              return {
                id: file.name.replace('.json', ''), 
                title: data.title || data.textTitle || "Texte sans titre",
                authorName: data.author || data.authorName || data.penName || "Plume Anonyme",
                views: Number(data.views || 0),
                li: Number(data.certified || data.totalCertified || data.li || 0),
                likes: Number(data.likes || data.totalLikes || 0),
                category: data.category || "Littérature",
                image: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${email || file.name}`,
                date: data.date || ""
              };
            } catch (err) { 
              return null; 
            }
          })
      );

      const validTexts = allTexts.filter(Boolean);
      setTexts(validTexts.sort((a, b) => b.views - a.views));

    } catch (e) {
      toast.error("Impossible de joindre la bibliothèque.");
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
                
                <div className="absolute top-8 right-8">
                  <span className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2">
                    <AlignLeft size={10} className="text-teal-400" /> {text.category}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                        <img src={text.image} alt="Auteur" className="w-full h-full object-cover" />
                     </div>
                     <p className="text-[10px] font-black uppercase text-teal-600 tracking-wider italic">{text.authorName}</p>
                  </div>

                  <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter leading-[1.1] group-hover:text-teal-600 transition-colors">
                    {text.title}
                  </h2>
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
                          <Heart size={16} className={`${text.likes > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-200'}`} />
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