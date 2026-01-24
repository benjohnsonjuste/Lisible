"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft, Eye, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import AdScript from "@/components/AdScript";

export default function TextPage({ params }) {
  // Correction cruciale : Déballer params (Requis pour Next.js 14/15)
  const unwrappedParams = React.use(params);
  const id = unwrappedParams?.id;

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [error, setError] = useState(false);

  const startTimeRef = useRef(null);
  const viewCountedRef = useRef(false);

  // 1. Chargement des données initiales
  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setUser(JSON.parse(loggedUser));

    if (!id) {
        setError(true);
        return;
    }

    const fetchText = async () => {
      try {
        // Cache-busting avec timestamp pour éviter les données périmées de GitHub
        const url = `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Texte introuvable");
        
        const data = await res.json();
        setText(data);
        
        // Initialiser le temps de lecture
        startTimeRef.current = Date.now();
        
        // Vérifier si déjà liké localement
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);
      } catch (err) {
        console.error(err);
        setError(true);
        toast.error("Impossible de charger ce texte.");
      }
    };

    fetchText();
  }, [id]);

  // 2. Logique de progression et de vue
  useEffect(() => {
    if (!text || viewCountedRef.current || !id) return;

    // Calcul du temps requis (200 mots/min)
    const wordCount = text.content ? text.content.split(/\s+/).length : 100;
    const estimatedSeconds = (wordCount / 200) * 60;
    const requiredSeconds = Math.min(Math.max(estimatedSeconds * 0.5, 5), 30); // Entre 5 et 30s max

    const timer = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min((elapsed / requiredSeconds) * 100, 100);
      setReadProgress(progress);

      if (elapsed >= requiredSeconds && !viewCountedRef.current) {
        viewCountedRef.current = true;
        handleIncrementView();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [text, id]);

  const handleIncrementView = async () => {
    const viewKey = `lisible_v2_viewed_${id}`;
    if (localStorage.getItem(viewKey)) return;

    try {
      await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'view', authorEmail: text.authorEmail })
      });
      localStorage.setItem(viewKey, "true");
      setText(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
    } catch (e) { console.error("Erreur vue"); }
  };

  // ... (Garder handleLike et handleComment identiques)
  const handleLike = async () => {
    if (isLiked || !text) return;
    setIsLiked(true); setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'like' })
      });
      if (res.ok) {
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        likedTexts.push(id);
        localStorage.setItem("lisible_likes", JSON.stringify(likedTexts));
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      }
    } catch (err) { setIsLiked(false); }
  };

  const handleComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter");
    if (!comment.trim()) return toast.error("Commentaire vide");
    setIsSubmitting(true);
    const newComment = { 
      id: Date.now(), authorName: user.name, message: comment.trim(), createdAt: new Date().toISOString() 
    };
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });
      if (res.ok) {
        setText(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
        setComment("");
        toast.success("Commentaire ajouté !");
      }
    } catch (err) { toast.error("Erreur d'envoi"); } finally { setIsSubmitting(false); }
  };

  if (error) return (
    <div className="py-20 text-center space-y-4">
      <p className="text-slate-500 font-black italic">Ce texte a disparu des archives...</p>
      <Link href="/bibliotheque" className="text-teal-600 font-bold uppercase text-[10px] tracking-widest">Retourner à la bibliothèque</Link>
    </div>
  );

  if (!text) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Synchronisation avec la plume...</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Barre de lecture fixe */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${readProgress}%` }} />
      </div>

      <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-colors group mt-4">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Bibliothèque
      </Link>

      <article className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
        <header className="p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 shadow-lg">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Auteur</p>
                <p className="text-sm font-black text-slate-900 italic leading-none">{text.authorName}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-600">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-[1.1]">
            {text.title}
          </h1>
        </header>

        {text.imageBase64 && (
          <div className="px-8 md:px-12 pb-8">
            <img src={text.imageBase64} alt="" className="w-full h-auto rounded-3xl shadow-sm border border-slate-50" />
          </div>
        )}

        <div className="px-8 md:px-12 prose prose-slate max-w-none">
          <div className="text-slate-800 leading-relaxed whitespace-pre-wrap font-serif text-xl md:text-2xl pb-12">
            {text.content}
          </div>
        </div>

        <div className="px-8 md:px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-3">
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isLiked ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
              {text.likesCount || 0}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-sm"><Share2 size={20} /></button>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(text.date).toLocaleDateString()}</span>
        </div>
      </article>

      {/* PUBLICITÉ */}
      <AdScript />

      {/* SECTION COMMENTAIRES */}
      <section className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Discussion ({(text.comments || []).length})</h3>
        
        {user ? (
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Exprimez votre ressenti..."
              className="w-full bg-slate-50 rounded-2xl p-4 border-none outline-none text-slate-800 font-medium min-h-[100px] resize-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <div className="flex justify-end">
              <button onClick={handleComment} disabled={isSubmitting || !comment.trim()} className="bg-slate-900 text-white py-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <Send size={14} />} PUBLIER
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Link href="/login" className="text-teal-600 font-black text-xs uppercase hover:underline">Connectez-vous pour commenter</Link>
          </div>
        )}

        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-teal-600 text-[10px] uppercase tracking-wider">{c.authorName}</span>
                <span className="text-[9px] text-slate-300 font-bold uppercase">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
