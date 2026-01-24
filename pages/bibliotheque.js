"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { User, Heart, MessageCircle, Calendar, BookOpen, X, Eye, Loader2 } from "lucide-react";

export default function Bibliotheque() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorFilter = searchParams.get("author");

  const [allTexts, setAllTexts] = useState([]);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTexts() {
      try {
        // Ajout d'un timestamp pour éviter le cache de l'API GitHub
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(file => file.name.endsWith('.json'))
            .map(async (file) => {
              const content = await fetch(`${file.download_url}?t=${Date.now()}`).then(r => r.json());
              const id = file.name.replace(".json", "");
              return { ...content, id }; 
            });
          
          const loadedTexts = await Promise.all(dataPromises);
          const sorted = loadedTexts.sort((a, b) => new Date(b.date) - new Date(a.date));
          setAllTexts(sorted);
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    }
    loadTexts();
  }, []);

  useEffect(() => {
    if (authorFilter) {
      const filtered = allTexts.filter(
        (t) => t.authorName?.toLowerCase() === authorFilter.toLowerCase()
      );
      setFilteredTexts(filtered);
    } else {
      setFilteredTexts(allTexts);
    }
  }, [authorFilter, allTexts]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <Loader2 className="animate-spin h-12 w-12 mb-4" />
      <div className="font-black uppercase tracking-widest text-[10px] animate-pulse">Ouverture de la bibliothèque...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12 py-10">
      <header className="text-center space-y-4">
        <div className="inline-flex p-5 bg-teal-50 text-teal-600 rounded-[2rem] shadow-sm mb-2 border border-teal-100">
          <BookOpen size={40} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Bibliothèque</h1>
        
        {authorFilter ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <p className="text-slate-500 font-medium bg-white px-6 py-2 rounded-full border border-slate-100 shadow-sm">
              Plumes de <span className="text-teal-600 font-black italic">"{authorFilter}"</span>
            </p>
            <button 
              onClick={() => router.push("/bibliotheque")}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 transition-all active:scale-95"
            >
              <X size={12} /> Réinitialiser
            </button>
          </div>
        ) : (
          <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
            Découvrez les œuvres uniques de nos auteurs et explorez l'imaginaire de la communauté.
          </p>
        )}
      </header>

      {filteredTexts.length === 0 ? (
        <div className="text-center py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-white shadow-inner">
          <p className="text-slate-400 font-bold text-lg mb-8 italic">
            {authorFilter ? `Aucun manuscrit trouvé pour "${authorFilter}".` : "Les rayons sont encore vides..."}
          </p>
          <Link href="/publish" className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">
            Publier le premier texte
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {filteredTexts.map((item) => (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <article className="bg-white rounded-[3rem] overflow-hidden flex flex-col h-full border border-slate-100 hover:border-teal-100 shadow-xl shadow-slate-200/50 hover:shadow-teal-100/40 transition-all duration-500 relative">
                
                {/* Image de Couverture */}
                <div className="relative h-72 w-full overflow-hidden bg-slate-100">
                  {item.imageBase64 ? (
                    <img 
                      src={item.imageBase64} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      alt={item.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-teal-50 flex items-center justify-center">
                      <BookOpen size={60} className="text-white drop-shadow-sm" />
                    </div>
                  )}
                  
                  {/* Badge Date flottant */}
                  <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl border border-white/50">
                    <Calendar size={12} className="text-teal-600" />
                    {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Contenu de la Carte */}
                <div className="p-10 flex flex-col flex-grow space-y-5">
                  <h2 className="text-3xl font-black text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight italic tracking-tighter">
                    {item.title}
                  </h2>
                  
                  <p className="text-slate-500 line-clamp-3 leading-relaxed font-serif text-lg opacity-90">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                    {/* Auteur */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-teal-400 shadow-lg">
                        <User size={18} />
                      </div>
                      <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{item.authorName}</span>
                    </div>

                    {/* Stats : Vues, Likes, Commentaires */}
                    <div className="flex gap-4">
                      {/* VUES RÉELLES */}
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Eye size={16} className="text-teal-500" /> 
                        <span className="text-xs font-black">{item.views || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Heart size={16} className={item.likesCount > 0 ? "fill-red-500 text-red-500" : ""} /> 
                        <span className="text-xs font-black">{item.likesCount || 0}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MessageCircle size={16} className="text-blue-400" /> 
                        <span className="text-xs font-black">{(item.comments || []).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <footer className="text-center py-20 border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Lisible Archives • 2026
        </p>
      </footer>
    </div>
  );
}
