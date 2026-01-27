"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, MessageCircle, Loader2 } from "lucide-react";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Ajout du timestamp pour éviter le cache de la liste des fichiers
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const promises = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => 
              // Ajout du timestamp sur chaque download_url pour les compteurs live
              fetch(`${f.download_url}?t=${Date.now()}`).then(r => r.json())
            );
          
          const data = await Promise.all(promises);
          // Tri par date décroissante
          setTexts(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (e) { 
        console.error("Erreur de chargement des textes:", e); 
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du rayonnage...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-2">
      {texts.map((item) => (
        <Link href={`/texts/${item.id}`} key={item.id} className="group">
          <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-500 h-full flex flex-col">
            
            {/* Zone Image / Preview */}
            <div className="h-60 bg-slate-100 relative overflow-hidden">
              {item.imageBase64 ? (
                <img 
                  src={item.imageBase64} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-teal-50 flex items-center justify-center font-black italic text-slate-200 text-4xl">
                  Lisible.
                </div>
              )}
              {/* Badge Date */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm">
                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
                  {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="p-8 flex-grow flex flex-col">
              <h2 className="text-3xl font-black italic text-slate-900 group-hover:text-teal-600 transition-colors mb-4 tracking-tighter leading-none">
                {item.title}
              </h2>
              
              <p className="text-slate-500 line-clamp-3 font-serif italic mb-8 leading-relaxed">
                {item.content}
              </p>
              
              <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  <span className="font-black text-[10px] uppercase text-teal-600 tracking-widest">@{item.authorName}</span>
                </div>

                {/* --- COMPTEURS AUTOMATIQUES --- */}
                <div className="flex gap-5 text-slate-400 font-black text-[11px]">
                  <span className="flex items-center gap-1.5 hover:text-teal-600 transition-colors">
                    <Eye size={16} className="text-teal-500/70"/> {item.views || 0}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-rose-600 transition-colors">
                    <Heart size={16} className="text-rose-500/70"/> {item.likes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                    <MessageCircle size={16} className="text-blue-500/70"/> {item.comments?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
