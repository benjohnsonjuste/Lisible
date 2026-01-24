"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { User, Heart, MessageCircle, Calendar, BookOpen, X, Search } from "lucide-react";

export default function Bibliotheque() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorFilter = searchParams.get("author"); // Récupère le paramètre ?author= dans l'URL

  const [allTexts, setAllTexts] = useState([]);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Chargement initial de tous les textes
  useEffect(() => {
    async function loadTexts() {
      try {
        const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications");
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(file => file.name.endsWith('.json'))
            .map(async (file) => {
              const content = await fetch(file.download_url).then(r => r.json());
              const id = file.name.replace(".json", "");
              return { ...content, id }; 
            });
          
          const loadedTexts = await Promise.all(dataPromises);
          // Tri du plus récent au plus ancien
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

  // 2. Filtrage réactif selon l'auteur sélectionné
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
    <div className="flex flex-col justify-center items-center py-20 text-teal-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-current mb-4"></div>
      <div className="font-black uppercase tracking-widest text-xs animate-pulse">Ouverture de la bibliothèque...</div>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-[1.5rem] shadow-sm mb-2">
          <BookOpen size={40} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Bibliothèque</h1>
        
        {authorFilter ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <p className="text-slate-500 font-medium">
              Publications de <span className="text-teal-600 font-black italic">"{authorFilter}"</span>
            </p>
            <button 
              onClick={() => router.push("/bibliotheque")}
              className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
            >
              <X size={14} /> Effacer le filtre
            </button>
          </div>
        ) : (
          <p className="text-slate-400 font-medium max-w-lg mx-auto">
            Explorez les récits, les réflexions et les partages de notre communauté littéraire.
          </p>
        )}
      </header>

      {filteredTexts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold text-lg mb-6">
            {authorFilter ? `Aucun texte trouvé pour "${authorFilter}".` : "La bibliothèque est encore vide."}
          </p>
          <Link href="/publish" className="btn-lisible gap-2">
            Publier le premier texte
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {filteredTexts.map((item) => (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <article className="card-lisible overflow-hidden p-0 flex flex-col h-full border-none ring-1 ring-slate-100 hover:ring-teal-500 hover:shadow-2xl hover:shadow-teal-100/50 transition-all duration-500">
                
                {/* Couverture */}
                <div className="relative h-64 w-full overflow-hidden bg-slate-50">
                  {item.imageBase64 ? (
                    <img 
                      src={item.imageBase64} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={item.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-teal-50 flex items-center justify-center">
                      <BookOpen size={48} className="text-teal-100" />
                    </div>
                  )}
                  {/* Badge Date */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                    <Calendar size={12} className="text-teal-600" />
                    {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight italic">
                    {item.title}
                  </h2>
                  
                  <p className="text-slate-500 line-clamp-3 mb-8 flex-grow leading-relaxed font-medium opacity-80">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm border border-white">
                        <User size={18} />
                      </div>
                      <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{item.authorName}</span>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-red-500 transition-colors">
                        <Heart size={16} className={item.likesCount > 0 ? "fill-red-500 text-red-500 border-none" : ""} /> 
                        <span className="text-xs font-black">{item.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-teal-600 transition-colors">
                        <MessageCircle size={16} /> 
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
    </div>
  );
}
