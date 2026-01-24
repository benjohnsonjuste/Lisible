"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft, Eye, Clock } from "lucide-react";
import Link from "next/link";
import AdSense from "@/components/AdSense"; // Import du script publicitaire

export default function TextPage({ params }) {
  const router = useRouter();
  const id = params?.id;

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const startTimeRef = useRef(null);
  const viewCountedRef = useRef(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setUser(JSON.parse(loggedUser));
    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        startTimeRef.current = Date.now();
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);
      } catch (err) {
        toast.error("Impossible de charger le texte.");
      }
    };
    fetchText();
  }, [id]);

  useEffect(() => {
    if (!text || viewCountedRef.current) return;
    const wordCount = text.content.split(/\s+/).length;
    const estimatedSeconds = (wordCount / 200) * 60;
    const requiredSeconds = Math.min(Math.max(estimatedSeconds * 0.7, 5), 45);

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
    const viewKey = `lisible_viewed_${id}`;
    if (localStorage.getItem(viewKey)) return;

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'view', authorEmail: text.authorEmail })
      });
      if (res.ok) {
        localStorage.setItem(viewKey, "true");
        setText(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
      }
    } catch (e) { console.error("Erreur vue"); }
  };

  const handleLike = async () => {
    if (isLiked || !text) return;
    setIsLiked(true);
    setIsAnimating(true);
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
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      }
    } catch (err) { setIsLiked(false); }
  };

  const handleComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter");
    if (!comment.trim()) return toast.error("Commentaire vide");
    setIsSubmitting(true);
    const newComment = { id: Date.now(), authorName: user.name, message: comment.trim(), createdAt: new Date().toISOString() };
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });
      if (res.ok) {
        setText(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
        setComment("");
        toast.success("Commentaire ajouté !");
      }
    } catch (err) { toast.error("Erreur d'envoi"); } finally { setIsSubmitting(false); }
  };

  if (!text) return (
    <div className="flex flex-col justify-center items-center py-20 text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-current mb-4"></div>
      <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Ouverture de l'œuvre...</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-500 ease-out" style={{ width: `${readProgress}%` }} />
      </div>

      <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-colors group">
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-teal-50"><ArrowLeft size={16} /></div> 
        Bibliothèque
      </Link>

      <article className="card-lisible bg-white p-0 overflow-hidden border-none ring-1 ring-slate-100 shadow-2xl shadow-slate-200/50">
        <header className="p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-100 shadow-inner">
                <User size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plume de</p>
                <p className="text-sm font-black text-slate-900 italic">{text.authorName}</p>
              </div>
            </div>
            <div className="flex gap-4 items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Eye size={16} className="text-teal-500" />
              <span className="text-sm font-black text-slate-700">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">
            {text.title}
          </h1>
        </header>

        {text.imageBase64 && (
          <div className="px-8 md:px-12 pb-8">
            <img src={text.imageBase64} alt="" className="w-full h-auto rounded-[2rem] shadow-lg border border-slate-50" />
          </div>
        )}

        <div className="px-8 md:px-12 prose prose-slate max-w-none">
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-serif text-xl md:text-2xl first-letter:text-6xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-3 first-letter:float-left">
            {text.content}
          </div>
        </div>

        {/* --- ZONE PUBLICITAIRE INTÉGRÉE --- */}
        <div className="px-8 md:px-12">
            <AdSense />
        </div>
        {/* ---------------------------------- */}

        <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isLiked ? 'bg-red-50 text-red-500' : 'bg-white text-slate-400 hover:text-red-400 border border-slate-100'}`}
            >
              <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
              {text.likesCount || 0}
            </button>
            <button 
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} 
              className="p-3 bg-white text-slate-400 rounded-2xl hover:text-teal-600 transition-colors shadow-sm border border-slate-100"
            >
              <Share2 size={20} />
            </button>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            {new Date(text.date).toLocaleDateString()}
          </span>
        </footer>
      </article>

      {/* Zone Commentaires */}
      <section className="space-y-6 pb-20">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
          Discussion ({(text.comments || []).length})
        </h3>
        {/* ... (Reste du formulaire et liste des commentaires) */}
      </section>
    </div>
  );
}
