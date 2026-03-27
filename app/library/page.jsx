"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Heart, Eye, Clock, ShieldCheck, Award, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      // Appel à ton API séparée
      const res = await fetch(`/api/github-db?type=library`, { cache: 'no-store' });
      const json = await res.json();
      
      // On récupère les données soit dans .content (si API adaptée), soit à la racine
      const data = json?.content || (Array.isArray(json) ? json : []);
      setTexts(data);
    } catch (e) {
      console.error("Erreur bibliothèque:", e);
      toast.error("Impossible de charger le Grand Livre.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTexts = useMemo(() => {
    return texts.filter(t => {
      const matchSearch = 
        t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.author?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filter === 'all') return matchSearch;
      if (filter === 'certified') return matchSearch && (t.certified > 0);
      if (filter === 'concours') return matchSearch && t.isConcours;
      return matchSearch;
    });
  }, [texts, searchTerm, filter]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      {/* Header & Filtres Fixes */}
      <div className="bg-white border-b sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-bold text-[#2D2424] flex items-center gap-2">
            <BookOpen className="text-[#8B4513]" />
            Le Grand Livre
          </h1>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder="Rechercher un manuscrit..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {['all', 'certified', 'concours'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f 
                  ? 'bg-[#2D2424] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'certified' ? 'Certifiés' : 'Duels'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille des manuscrits */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#8B4513]/20 border-t-[#8B4513] rounded-full animate-spin"></div>
            <p className="text-[#8B4513] font-serif animate-pulse">Consultation des archives...</p>
          </div>
        ) : filteredTexts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTexts.map((item) => (
              <Link key={item.id} href={`/reader?id=${item.id}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer">
                  
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={item.image || `https://images.unsplash.com/photo-1457369804590-52c65a46227d?w=800&q=80`} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1457369804590-52c65a46227d?w=800&q=80"; }}
                    />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {item.certified > 0 && (
                        <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-lg">
                          <Award className="w-4 h-4 fill-current" />
                        </div>
                      )}
                      {item.isConcours && (
                        <div className="bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" /> Duel
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B4513] bg-[#8B4513]/5 px-2 py-0.5 rounded">
                        {item.category || "Littérature"}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-serif font-bold text-[#2D2424] line-clamp-2 group-hover:text-[#8B4513] transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mt-1 mb-4 flex items-center gap-1">
                      par <span className="font-medium text-gray-700">{item.author}</span>
                      {item.authorIsOfficial && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                    </p>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" /> {item.views || 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Heart className="w-3.5 h-3.5" /> {item.likes || 0}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-300">
                        #{item.genre || "Libre"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-400">Aucun manuscrit trouvé</h3>
          </div>
        )}
      </div>

      {/* Bouton de Publication flottant (Mobile) */}
      <Link href="/publish" className="fixed bottom-6 right-6 md:hidden bg-[#8B4513] text-white p-4 rounded-full shadow-2xl active:scale-95 transition-transform">
        <Zap className="w-6 h-6 fill-current" />
      </Link>
    </div>
  );
}
