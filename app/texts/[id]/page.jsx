"use client";
import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Eye, Heart, MessageCircle, 
  Wind, Flame, Ghost, Share2, ArrowLeft, 
  BookOpen, Sparkles, Clock, Bookmark
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ReadingPage({ params }) {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState({ label: "Neutre", icon: <Wind size={16}/> });
  const [isLiked, setIsLiked] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    async function loadContent() {
      try {
        // 1. Récupération du fichier via l'API GitHub (cache: 'no-store' pour les stats fraîches)
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${params.id}.json?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        
        // Décodage UTF-8 universel (gère créole et français parfaitement)
        const decodedContent = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(decodedContent);
        
        // 2. Calcul du temps de lecture (moyenne 200 mots/min)
        const words = decodedContent.content.split(/\s+/).length;
        setReadingTime(Math.ceil(words / 200));

        // 3. Analyse de l'ambiance
        analyzeMood(decodedContent.content);

        // 4. Incrémenter la vue via l'API unifiée
        fetch('/api/github-db', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: params.id, type: 'view' })
        });
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger le manuscrit.");
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [params.id]);

  const analyzeMood = (content) => {
    const textLower = content.toLowerCase();
    if (['guerre', 'sang', 'épée', 'justice', 'révolution', 'flamme'].some(w => textLower.includes(w))) {
      setMood({ label: "Épique", icon: <Flame className="text-orange-500" size={16}/> });
    } else if (['triste', 'douleur', 'noir', 'seul', 'adieu', 'nuit'].some(w => textLower.includes(w))) {
      setMood({ label: "Mélancolique", icon: <Ghost className="text-blue-400" size={16}/> });
    } else if (['amour', 'cœur', 'passion', 'beauté', 'baiser'].some(w => textLower.includes(w))) {
      setMood({ label: "Passionné", icon: <Sparkles className="text-pink-400" size={16}/> });
    }
  };

  const handleLike = async () => {
    if (isLiked) return;
    setIsLiked(true);
    try {
      await fetch('/api/github-db', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, type: 'like' })
      });
      setText(prev => ({ ...prev, stats: { ...prev.stats, likes: (prev.stats?.likes || 0) + 1 } }));
      toast.success("Aimé !");
    } catch (e) {
      setIsLiked(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien de partage copié !");
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au Data Lake...</p>
    </div>
  );

  return (
    <article className="min-h-screen bg-white">
      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/library" className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:text-teal-600 transition-colors">
            <ArrowLeft size={16} /> Retour
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={copyLink} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <Share2 size={16} className="text-slate-600" />
            </button>
            <button className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <Bookmark size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Work Header */}
        <header className="mb-16 space-y-8">
          <div className="flex items-center gap-3">
            {text.certified && (
              <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full border border-teal-100">
                <ShieldCheck size={14} fill="currentColor" className="text-white"/>
                <span className="text-[9px] font-black uppercase tracking-tighter">Certifié Original</span>
              </div>
            )}
            <div className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tighter">
              {text.category}
            </div>
          </div>

          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-slate-900 leading-[0.85]">
            {text.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-slate-100">
            <Link href={`/author/${btoa(text.authorEmail)}`} className="flex items-center gap-3 group">
              <img 
                src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${text.authorEmail}`} 
                className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-transparent group-hover:ring-teal-500 transition-all" 
                alt={text.penName}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{text.penName}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">La Plume</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-5 ml-auto text-slate-400">
              <span className="flex items-center gap-1.5 text-[10px] font-bold"><Eye size={14}/> {text.stats?.views || 0}</span>
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-[10px] font-bold transition-all ${isLiked ? 'text-pink-500 scale-110' : 'hover:text-pink-500'}`}
              >
                <Heart size={14} fill={isLiked ? "currentColor" : "none"} /> 
                {text.stats?.likes || 0}
              </button>
              <span className="flex items-center gap-1.5 text-[10px] font-bold"><Clock size={14}/> {readingTime} min</span>
            </div>
          </div>
        </header>

        {/* The Manuscript */}
        <section className="relative">
          <div className="absolute -left-12 top-0 hidden lg:flex flex-col gap-6 sticky top-32">
             <div className="flex flex-col items-center gap-1 text-teal-600">
                {mood.icon}
                <span className="text-[8px] font-black uppercase vertical-text tracking-widest">{mood.label}</span>
             </div>
          </div>

          <div className="prose prose-slate prose-xl max-w-none">
            <div className="font-serif text-xl md:text-2xl leading-[1.9] text-slate-800 whitespace-pre-wrap selection:bg-teal-100 first-letter:text-8xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-slate-900 first-letter:italic">
              {text.content}
            </div>
          </div>
        </section>

        {/* Interaction Footer */}
        <footer className="mt-24">
          <div className="p-12 bg-slate-950 rounded-[4rem] text-center text-white shadow-2xl shadow-slate-200">
            <Sparkles className="mx-auto mb-6 text-teal-400" size={32} />
            <h4 className="text-3xl font-black italic mb-4 tracking-tighter">L'art appelle l'échange.</h4>
            <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto font-medium">Soutenez ce travail en laissant une trace de votre passage.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-slate-950 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-500 hover:text-white transition-all">
                Écrire un commentaire
              </button>
              <button className="bg-slate-800 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all">
                Offrir un Li
              </button>
            </div>
          </div>
          
          <div className="mt-12 text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Lisible Streaming Service • 2026</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </article>
  );
}
