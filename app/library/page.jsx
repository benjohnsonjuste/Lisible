"use client";
import React, { useEffect, useState } from 'react';
import { 
  Search, BookOpen, Clock, Sparkles, 
  ChevronRight, Filter, TrendingUp 
} from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function fetchLibrary() {
      try {
        // On récupère l'index central pour la performance
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/index.json?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        // Décodage Base64 du contenu de l'index
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setWorks(content.reverse()); // Les plus récents en premier
      } catch (err) {
        console.error("Erreur de chargement de l'index:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  const categories = ["All", "Poetry", "Novel", "Essay", "Battle"];

  const filteredWorks = works.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          w.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || w.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Library...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
              Library<span className="text-teal-600">.</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 flex items-center gap-2">
              <TrendingUp size={14} /> Explore the data lake
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search a masterpiece..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl md:rounded-3xl pl-14 pr-6 py-4 md:py-5 text-sm font-bold outline-none focus:border-teal-500/20 transition-all"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-3 mt-12 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid Section */}
      <main className="max-w-7xl mx-auto px-6">
        {filteredWorks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredWorks.map((work) => (
              <Link 
                href={`/texts/${work.id}`} 
                key={work.id}
                className="group relative bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter border border-teal-100/50">
                    {work.category}
                  </div>
                  {work.isConcours && (
                    <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                      <Sparkles size={14} />
                      <span className="text-[8px] font-black uppercase">Contest</span>
                    </div>
                  )}
                </div>

                <h3 className="text-2xl md:text-3xl font-black italic text-slate-900 tracking-tighter mb-4 group-hover:text-teal-600 transition-colors line-clamp-2">
                  {work.title}
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-50">
                      <img 
                        src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${work.authorEmail}`} 
                        alt={work.author} 
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      By {work.author}
                    </span>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-300">
                      <div className="flex items-center gap-1 text-[9px] font-bold">
                        <Clock size={12} /> {new Date(work.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-950 text-white rounded-2xl flex items-center justify-center group-hover:bg-teal-600 transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="text-slate-200" size={32} />
            </div>
            <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No manuscripts found in this sector</p>
          </div>
        )}
      </main>
    </div>
  );
}
