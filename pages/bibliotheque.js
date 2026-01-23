import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Heart, MessageCircle, Calendar, BookOpen } from "lucide-react";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTexts() {
      try {
        // Récupération de la liste des fichiers sur GitHub
        const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications");
        const files = await res.json();
        
        if (Array.isArray(files)) {
          const dataPromises = files
            .filter(file => file.name.endsWith('.json')) // Sécurité : on ne prend que les JSON
            .map(async (file) => {
              const content = await fetch(file.download_url).then(r => r.json());
              const id = file.name.replace(".json", "");
              return { ...content, id }; 
            });
          
          const allTexts = await Promise.all(dataPromises);
          
          // Tri par date décroissante
          setTexts(allTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    }
    loadTexts();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <div className="text-gray-500 font-medium animate-pulse">Ouverture de la bibliothèque...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
            <BookOpen size={32} />
          </div>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Lisible</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Explorez les récits, réflexions et partages de notre communauté.
        </p>
      </header>

      {texts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-200 shadow-sm">
          <p className="text-gray-400 text-lg">La bibliothèque est vide pour le moment.</p>
          <Link href="/publish" className="text-blue-600 font-bold mt-4 inline-block hover:underline">
            Soyez le premier à publier →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {texts.map((item) => (
            <Link href={`/texts/${item.id}`} key={item.id} className="group">
              <article className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col">
                
                {/* Zone Image */}
                <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                  {item.imageBase64 ? (
                    <img 
                      src={item.imageBase64} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={item.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <BookOpen size={48} className="text-blue-300" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black text-gray-800 uppercase tracking-widest shadow-sm">
                    <Calendar size={12} className="text-blue-600" />
                    {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h2>
                  
                  <p className="text-gray-500 line-clamp-3 mb-8 flex-grow leading-relaxed font-serif">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                        <User size={20} />
                      </div>
                      <span className="font-bold text-gray-800 text-sm tracking-tight">{item.authorName}</span>
                    </div>

                    <div className="flex gap-5">
                      <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-red-500 transition-colors">
                        <Heart size={18} className={item.likesCount > 0 ? "fill-red-500 text-red-500" : ""} /> 
                        <span className="text-sm font-black">{item.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-blue-500 transition-colors">
                        <MessageCircle size={18} /> 
                        <span className="text-sm font-black">{(item.comments || []).length}</span>
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
