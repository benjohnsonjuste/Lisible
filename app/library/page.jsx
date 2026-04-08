"use client";
import React, { useEffect, useState } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import TextCard from '@/components/TextCard';

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/github-db?type=library'); // Remplace par ton chemin réel
      const data = await res.json();
      if (data && data.content) {
        setItems(data.content);
      }
    } catch (err) {
      console.error("Erreur chargement bibliothèque:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.author.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Tous" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Tous", ...new Set(items.map(i => i.category))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
        <p className="text-slate-500">Ouverture de la bibliothèque...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Filtres */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Bibliothèque</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Rechercher un titre ou un auteur..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter className="text-slate-400 w-5 h-5 hidden md:block" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  category === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille de résultats */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <TextCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
          <p className="text-slate-500">Aucun manuscrit ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
