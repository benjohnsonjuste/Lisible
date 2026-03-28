"use client";
import React, { useEffect, useState } from 'react';
import { 
  Search, BookOpen, ShieldCheck, Heart, 
  ChevronRight, Loader2, Sparkles, Filter,
  BookMarked,
  LayoutGrid,
  List
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LibraryPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

  const categories = ["Tous", "Poésie", "Nouvelle", "Roman", "Essai", "Théâtre", "Chronique"];

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const res = await fetch('/api/github-db?type=library');
        if (res.ok) {
          const data = await res.json();
          if (data && data.content) {
            setWorks(data.content);
          }
        }
      } catch (e) {
        console.error("Erreur bibliothèque:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  const filteredWorks = works.filter(w => {
    const matchesSearch = w.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         w.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Tous" || w.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">
        Ouverture des Archives...<br/>
        <span className="opacity-50">Chargement de la Bibliothèque Universelle</span>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] pb-32">
      {/* HEADER SECTION */}
      <header className="pt-20 pb-12 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked size={16} className="text-teal-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600">Archive Publique</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
              La Biblio.
            </h1>
            <p className="text-slate-400 font-medium max-w-md text-sm leading-relaxed">
              Explorez les œuvres certifiées de la communauté Lisible. Des manuscrits authentiques, scellés par la lecture.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Chercher un titre, une plume..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                />
             </div>
          </div>
        </div>

        {/* CATEGORIES & FILTERS */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-slate-100 pt-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-white text-slate-400 border border-slate-100 hover:border-teal-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center bg-white rounded-xl border border-slate-100 p-1">
             <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}
             >
                <LayoutGrid size={18} />
             </button>
             <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-300'}`}
             >
                <List size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* WORKS GRID */}
      <main className="max-w-7xl mx-auto px-6 md:px-12">
        {filteredWorks.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "flex flex-col gap-4"
          }>
            {filteredWorks.map((work, index) => (
              <Link 
                href={`/texts/${work.id}`} 
                key={work.id}
                className={`group bg-white border border-slate-100 transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
                  viewMode === 'grid' ? "rounded-[2.5rem]" : "rounded-3xl flex items-center p-4 gap-6"
                }`}
              >
                {/* Image Container */}
                <div className={`relative bg-slate-50 overflow-hidden ${
                  viewMode === 'grid' ? "aspect-[4/5] w-full" : "w-24 h-24 rounded-2xl shrink-0"
                }`}>
                  {work.image ? (
                    <Image 
                      src={work.image} 
                      alt={work.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                      <BookOpen size={viewMode === 'grid' ? 60 : 30} />
                    </div>
                  )}
                  {/* Badge de catégorie flottant */}
                  {viewMode === 'grid' && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900">
                        {work.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`flex flex-col justify-between ${viewMode === 'grid' ? "p-8" : "flex-1"}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-xl group-hover:text-teal-600 transition-colors line-clamp-1 leading-tight">
                        {work.title}
                      </h3>
                      {(work.certified > 0) && <ShieldCheck size={16} className="text-teal-500 shrink-0" />}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Par {work.author}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-teal-500" />
                        <span className="text-[10px] font-black text-slate-900">{work.certified || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart size={14} className="text-rose-500" />
                        <span className="text-[10px] font-black text-slate-900">{work.likes || 0}</span>
                      </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Sparkles size={32} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black italic text-slate-900 mb-2">Aucune correspondance.</h2>
            <p className="text-slate-400 text-sm font-medium">L'archive est vaste, mais cette plume semble manquer.</p>
            <button 
              onClick={() => { setSearchTerm(""); setActiveCategory("Tous"); }}
              className="mt-8 text-[10px] font-black uppercase tracking-widest text-teal-600 underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
