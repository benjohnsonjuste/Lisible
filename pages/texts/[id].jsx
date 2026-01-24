"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Heart, Share2, User, Send, ArrowLeft, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import AdScript from "@/components/AdScript";

export default function TextPage({ params }) {
  // Gestion sécurisée des params
  const [id, setId] = useState(null);
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

  // 1. Déballage de l'ID (Correction du crash)
  useEffect(() => {
    if (params instanceof Promise) {
      params.then(p => setId(p.id));
    } else {
      setId(params?.id);
    }
  }, [params]);

  // 2. Chargement du texte et de l'utilisateur
  useEffect(() => {
    if (!id) return;

    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setUser(JSON.parse(loggedUser));

    const fetchText = async () => {
      try {
        const url = `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Texte introuvable");
        
        const data = await res.json();
        setText(data);
        
        startTimeRef.current = Date.now();
        
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    fetchText();
  }, [id]);

  // 3. Logique de Progression et Vue Unique
  useEffect(() => {
    if (!text || viewCountedRef.current || !id) return;

    const wordCount = text.content ? text.content.split(/\s+/).length : 100;
    const estimatedSeconds = (wordCount / 200) * 60;
    const requiredSeconds = Math.min(Math.max(estimatedSeconds * 0.4, 8), 30); 

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
    const viewKey = `lisible_v1_viewed_${id}`;
    if (localStorage.getItem(viewKey)) return;

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          type: 'view', 
          authorEmail: text.authorEmail 
        })
      });

      if (res.ok) {
        localStorage.setItem(viewKey, "true");
        setText(prev => ({ ...prev, views: (prev?.views || 0) + 1 }));
      }
    } catch (e) {
      console.error("Analytics Error");
    }
  };

  const handleLike = async () => {
    if (isLiked || !text) return;
    setIsLiked(true); setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'like' })
      });
      if (res.ok) {
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        likedTexts.push(id);
        localStorage.setItem("lisible_likes", JSON.stringify(likedTexts));
        setText(prev => ({ ...prev, likesCount: (prev?.likesCount || 0) + 1 }));
      }
    } catch (err) { setIsLiked(false); }
  };

  const handleComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter");
    if (!comment.trim()) return toast.error("Commentaire vide");
    setIsSubmitting(true);
    const newComment = { 
      id: Date.now(), authorName: user.name || "Auteur", message: comment.trim(), createdAt: new Date().toISOString() 
    };
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });
      if (res.ok) {
        setText(prev => ({ ...prev, comments: [...(prev?.comments || []), newComment] }));
        setComment("");
        toast.success("Commentaire ajouté !");
      }
    } catch (err) { toast.error("Erreur d'envoi"); } finally { setIsSubmitting(false); }
  };

  if (error) return <div className="py-20 text-center"><p className="text-slate-400 font-black italic uppercase">Texte introuvable ou erreur de lien</p></div>;
  if (!text) return <div className="flex flex-col items-center py-40 text-teal-600"><Loader2 className="animate-spin mb-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Ouverture du manuscrit...</span></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-700">
      
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-slate-100">
        <div 
          className="h-full bg-teal-500 transition-all duration-300" 
          style={{ width: `${readProgress}%` }} 
        />
      </div>

      <header className="pt-8">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
      </header>

      <article className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
        <div className="p-8 md:p-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400"><User size={20}/></div>
              <p className="text-sm font-black text-slate-900 italic">{text.authorName || "Anonyme"}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>

          {text.imageBase64 && <img src={text.imageBase64} className="w-full h-auto rounded-3xl shadow-sm" alt="" />}

          <div className="text-slate-800 leading-relaxed font-serif text-xl md:text-2xl whitespace-pre-wrap pt-4 pb-12">
            {text.content}
          </div>
        </div>

        <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-3">
            <button onClick={handleLike} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isLiked ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 border border-slate-100'}`}>
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
              {text.likesCount || 0}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100"><Share2 size={20}/></button>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            {text.date ? new Date(text.date).toLocaleDateString() : 'Date inconnue'}
          </span>
        </footer>
      </article>

      <AdScript />

      <section className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Discussion ({(text.comments || []).length})</h3>
        
        {user ? (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Partagez votre avis..." className="w-full bg-slate-50 rounded-2xl p-4 border-none outline-none text-slate-800 font-medium min-h-[100px] resize-none focus:ring-2 focus:ring-teal-500/20" />
            <div className="flex justify-end">
              <button onClick={handleComment} disabled={isSubmitting || !comment.trim()} className="bg-slate-900 text-white py-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} PUBLIER
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Link href="/login" className="text-teal-600 font-black text-xs uppercase hover:underline">Se connecter pour commenter</Link>
          </div>
        )}

        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-teal-600 text-[10px] uppercase">{c.authorName}</span>
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
