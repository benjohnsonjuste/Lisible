"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Heart, Award, Search, BookOpen, User, Zap, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function LibraryPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  // 1. Gestion de l'hydratation et chargement initial
  useEffect(() => {
    setMounted(true);
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/github-db?type=library', { cache: 'no-store' });
      const json = await res.json();
      
      // On extrait les données du champ 'content' envoyé par ton API
      const data = json?.content || (Array.isArray(json) ? json : []);
      setTexts(data);
    } catch (e) {
      console.error("Erreur de chargement:", e);
      toast.error("Connexion aux archives interrompue.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Filtrage et Recherche (Performance optimisée avec useMemo)
  const filteredTexts = useMemo(() => {
    return texts.filter(t => 
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [texts, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header Futuriste Fixe */}
      <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5)]">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              La Bibliothèque
            </h1>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text"
              placeholder="Rechercher un manuscrit..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contenu de la page */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">Initialisation du flux...</p>
          </div>
        ) : filteredTexts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTexts.map((item) => (
              <Link key={item.id} href={`/texts/${item.id}`} className="group">
                <div className="relative h-full bg-[#16161a] border border-white/5 rounded-3xl p-6 transition-all duration-500 hover:border-purple-500/50 hover:bg-[#1c1c22] hover:-translate-y-2 overflow-hidden flex flex-col">
                  
                  {/* Effet Visuel Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Badge Duel / Concours */}
                  {item.isConcours && (
                    <div className="self-end mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                      <Zap className="w-3 h-3 fill-current" /> Duel
                    </div>
                  )}

                  {/* Header de la carte */}
                  <div className="mb-6">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em]">
                      {item.category || "Inclassable"}
                    </span>
                    <h3 className="text-xl font-bold mt-2 leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  {/* Auteur */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400 truncate">{item.author}</span>
                  </div>

                  {/* Stats Standardisées (Futuriste) */}
                  <div className="mt-auto grid grid-cols-3 gap-2 bg-black/40 rounded-2xl p-4 border border-white/5">
                    <div className="flex flex-col items-center border-r border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase font-black mb-1">Views</span>
                      <div className="flex items-center gap-1 text-blue-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-bold">{item.views || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center border-r border-white/5">
                      <span className="text-[9px] text-gray-500 uppercase font-black mb-1">Certifs</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Award className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-bold">{item.certified || 0}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-gray-500 uppercase font-black mb-1">Likes</span>
                      <div className="flex items-center gap-1 text-pink-500">
                        <Heart className="w-3.5 h-3.5 fill-current opacity-70" />
                        <span className="text-xs font-mono font-bold">{item.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
            <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-500 uppercase tracking-tighter">Aucun résultat trouvé</h2>
            <p className="text-gray-600 mt-2">Réessayez avec d'autres termes de recherche.</p>
          </div>
        )}
      </main>
    </div>
  );
}
