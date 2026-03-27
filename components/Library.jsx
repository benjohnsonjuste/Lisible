"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Heart, Award, Search, BookOpen, Clock, User, Zap } from 'lucide-react';
import Link from 'next/link';

const Library = ({ initialTexts = [] }) => {
  const [texts, setTexts] = useState(initialTexts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
    // Optionnel : Si tu veux fetch les données côté client au lieu de les passer en props
    // fetchInitial(); 
  }, []);

  // Tri intelligent : Certifiés d'abord, puis Likes, puis Date
  const sortedAndFilteredTexts = useMemo(() => {
    let result = [...texts];

    // Recherche
    if (searchTerm) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    return result.sort((a, b) => {
      if (b.certified !== a.certified) return b.certified - a.certified;
      if (b.likes !== a.likes) return b.likes - a.likes;
      return new Date(b.date) - new Date(a.date);
    });
  }, [texts, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12">
      {/* Header Futuriste */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
          <div>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ARCHIVES NUMÉRIQUES
            </h1>
            <p className="text-gray-400 mt-2 font-light">Explorez les manuscrits de la nouvelle ère.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher un titre ou un auteur..."
              className="bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grille de Textes */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedAndFilteredTexts.map((item) => (
          <Link key={item.id} href={`/texts/${item.id}`} className="group">
            <div className="relative h-full bg-[#16161a] border border-white/5 rounded-3xl p-6 transition-all duration-500 hover:border-purple-500/50 hover:bg-[#1c1c22] hover:-translate-y-2 overflow-hidden">
              
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Tag Concours */}
              {item.isConcours && (
                <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                  <Zap className="w-3 h-3 fill-current" /> Duel
                </div>
              )}

              {/* Contenu */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{item.category}</span>
                  <h3 className="text-xl font-bold mt-2 leading-tight group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{item.author}</span>
                </div>

                {/* Stats Footer */}
                <div className="mt-auto grid grid-cols-3 gap-2 bg-black/30 rounded-2xl p-4 border border-white/5">
                  <div className="flex flex-col items-center border-r border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Vues</span>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Eye className="w-3 h-3" />
                      <span className="text-sm font-mono">{item.views || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center border-r border-white/10">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Certifs</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Award className="w-3 h-3" />
                      <span className="text-sm font-mono">{item.certified || 0}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Likes</span>
                    <div className="flex items-center gap-1 text-pink-500">
                      <Heart className="w-3 h-3 fill-current opacity-70" />
                      <span className="text-sm font-mono">{item.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Library;
