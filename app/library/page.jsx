"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  BookOpen, Search, Loader2, Star, Eye, Clock, 
  ChevronRight, Filter, Book, Sparkles, Hash
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
};

// Cache simple pour éviter le rechargement au changement de page interne
let libraryCache = null;

export default function LibraryPage() {
  const [books, setBooks] = useState(libraryCache || []);
  const [loading, setLoading] = useState(!libraryCache);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Tous");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    loadLibraryData();
  }, []);

  async function loadLibraryData() {
    try {
      const pubUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications`;
      const res = await fetch(pubUrl);
      
      if (!res.ok) throw new Error("Impossible d'accéder aux publications");

      const files = await res.json();
      
      // Récupération de chaque fichier JSON individuellement
      const booksData = await Promise.all(
        files
          .filter(f => f.name.endsWith('.json'))
          .map(async (file) => {
            try {
              const fileRes = await fetch(file.download_url);
              const data = await fileRes.json();
              return {
                id: data.id || file.name.replace('.json', ''),
                title: data.title || "Titre inconnu",
                author: data.authorName || "Plume Anonyme",
                authorEmail: data.authorEmail,
                category: data.category || "Littérature",
                description: data.description || data.excerpt || "Aucune description disponible.",
                cover: data.coverImage || data.image || null,
                views: Number(data.views || 0),
                likes: Number(data.likes || 0),
                date: data.createdAt || data.date || new Date().toISOString(),
                readTime: data.readTime || "5 min"
              };
            } catch (err) { return null; }
          })
      );

      const finalBooks = booksData
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      libraryCache = finalBooks;
      setBooks(finalBooks);
    } catch (e) {
      console.error("Erreur Library:", e);
      toast.error("Échec du chargement de la bibliothèque.");
    } finally {
      setLoading(false);
    }
  }

  // Filtrage intelligent
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "Tous" || book.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, filterCategory]);

  // Extraction des catégories uniques
  const categories = useMemo(() => {
    const cats = books.map(b => b.category);
    return ["Tous", ...new Set(cats)];
  }, [books]);

  if (loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-slate-400 font-medium italic">Ouverture des archives...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBF9] pb-20">
      {/* Header Stylisé */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <header className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-teal-600 font-bold uppercase tracking-[0.3em] text-xs">
              <BookOpen size={16} />
              <span>Archives Numériques</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
              Biblio<span className="text-teal-600">.</span>
            </h1>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative group w-full sm:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un ouvrage..." 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 shadow-sm outline-none focus:border-teal-500/50 transition-all text-sm"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Filtres de Catégories */}
        <div className="flex flex-wrap gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                filterCategory === cat 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille d'ouvrages */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.slice(0, visibleCount).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <Book className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 italic">Aucun ouvrage ne correspond à votre recherche.</p>
          </div>
        )}

        {/* Load More */}
        {filteredBooks.length > visibleCount && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="px-10 py-5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all shadow-xl"
            >
              Parcourir les étagères suivantes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BookCard({ book }) {
  return (
    <Link href={`/read/${book.id}`} className="group">
      <div className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
        {/* Cover Preview */}
        <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 bg-slate-50 border border-slate-100">
          <img 
            src={book.cover || `https://images.unsplash.com/photo-1543005139-059c1525938e?q=80&w=800`}
            alt={book.title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Star size={10} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black text-slate-900">{book.likes}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-2 grow flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-md">
              {book.category}
            </span>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
              <Clock size={10} /> {book.readTime}
            </span>
          </div>
          
          <h3 className="text-xl font-black italic text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-teal-600 transition-colors">
            {book.title}
          </h3>
          
          <p className="text-slate-500 text-xs line-clamp-2 mb-6 italic leading-relaxed">
            {book.description}
          </p>

          <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <img 
                  src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${book.authorEmail}`} 
                  alt={book.author}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                {book.author}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Eye size={12} />
              <span className="text-[10px] font-bold">{book.views}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
