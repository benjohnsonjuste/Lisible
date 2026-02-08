"use client";
import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Eye, Heart, MessageCircle, 
  Wind, Flame, Ghost, Share2, ArrowLeft, 
  BookOpen, Sparkles, Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReadingPage({ params }) {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState({ label: "Neutre", icon: <Wind size={16}/> });
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        // 1. Récupération du fichier JSON via l'API GitHub
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${params.id}.json`, { cache: 'no-store' });
        const data = await res.json();
        
        // Décodage UTF-8 robuste pour les accents
        const decodedContent = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(decodedContent);
        
        // 2. Analyse automatique de l'ambiance (Mood)
        analyzeMood(decodedContent.content);

        // 3. Incrémenter la vue via ton API unifiée
        fetch('/api/github-db', {
          method: 'PATCH',
          body: JSON.stringify({ id: params.id, type: 'view' })
        });
      } catch (err) {
        toast.error("Erreur de chargement de l'œuvre");
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [params.id]);

  const analyzeMood = (content) => {
    const textLower = content.toLowerCase();
    if (['guerre', 'flamme', 'sang', 'combat', 'épée', 'force'].some(w => textLower.includes(w))) {
      setMood({ label: "Épique", icon: <Flame className="text-orange-500" size={16}/> });
    } else if (['triste', 'larme', 'vide', 'nuit', 'adieu', 'seul'].some(w => textLower.includes(w))) {
      setMood({ label: "Mélancolique", icon: <Ghost className="text-blue-400" size={16}/> });
    } else if (['amour', 'cœur', 'douceur', 'belle', 'rêve'].some(w => textLower.includes(w))) {
      setMood({ label: "Romantique", icon: <Sparkles className="text-pink-400" size={16}/> });
    }
  };

  const handleLike = () => {
    if (!isLiked) {
      setIsLiked(true);
      fetch('/api/github-db', {
        method: 'PATCH',
        body: JSON.stringify({ id: params.id, type: 'like' })
      });
      toast.success("Vous avez aimé cette œuvre");
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ouverture du manuscrit...</p>
    </div>
  );

  return (
    <article className="min-h-screen bg-white pb-20">
      {/* Barre de navigation supérieure */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/library" className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-tighter">
            <ArrowLeft size={16} /> Bibliothèque
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => toast.info("Lien copié !")} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <Share2 size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 mt-16">
        {/* En-tête de l'œuvre */}
        <header className="mb-12 space-y-6">
          {text.certified && (
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full border border-teal-100 animate-in fade-in slide-in-from-bottom-2">
              <ShieldCheck size={16} fill="currentColor" className="text-white"/>
              <span className="text-[10px] font-black uppercase tracking-tighter">Certifié par Lisible</span>
            </div>
          )}

          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 leading-tight">
            {text.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
            <Link href={`/author/${btoa(text.authorEmail)}`} className="group flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} alt={text.penName} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                {text.penName}
              </span>
            </Link>
            
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1 text-[10px] font-bold"><Eye size={14}/> {text.stats?.views || 0}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${isLiked ? 'text-pink-500' : ''}`}>
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} onClick={handleLike} className="cursor-pointer" /> 
                {text.stats?.likes || 0}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {mood.icon} {mood.label}
              </span>
            </div>
          </div>
        </header>

        {/* Corps du texte */}
        <section className="prose prose-slate prose-xl max-w-none">
          <div className="font-serif text-xl leading-[1.8] text-slate-800 whitespace-pre-wrap first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-teal-600">
            {text.content}
          </div>
        </section>

        {/* Pied de page de l'œuvre */}
        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <div className="inline-block p-10 bg-slate-50 rounded-[3rem] w-full max-w-xl">
            <h4 className="text-2xl font-black italic mb-4">Cette œuvre vous a inspiré ?</h4>
            <p className="text-sm text-slate-500 mb-8">Soutenez {text.penName} en laissant un commentaire ou en offrant une certification.</p>
            <div className="flex gap-4 justify-center">
              <button className="bg-slate-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                <MessageCircle size={16}/> Commenter
              </button>
              <button className="bg-teal-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                <Sparkles size={16}/> Certifier
              </button>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
