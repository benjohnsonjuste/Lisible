"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, ArrowLeft, Eye, 
  Loader2, Edit3, MessageSquare, Send 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TextPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id) : null;

  // --- ÉTATS ---
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);

  // Interactions
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // --- 1. CHARGEMENT INITIAL ---
  const fetchPageData = useCallback(async () => {
    if (!rawId) return;
    
    try {
      const storedUser = localStorage.getItem("lisible_user");
      const userData = storedUser ? JSON.parse(storedUser) : null;
      setUser(userData);

      const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
      const dataText = await resText.json();
      
      const found = dataText.find(t => {
          const jsonId = String(t.id).trim();
          const urlId = String(rawId).trim();
          return jsonId === urlId || jsonId === urlId.split('-')[0];
      });
      
      if (found) {
        setText(found);
        setLikesCount(Number(found.likes) || 0);
        setViewsCount(Number(found.views) || 0);

        const likedTexts = JSON.parse(localStorage.getItem("lisible_liked") || "[]");
        setHasLiked(likedTexts.includes(String(found.id)));

        // LOGIQUE : COMPTEUR DE VUES AUTOMATIQUE (Appel à /api/increment-view)
        const viewKey = `viewed_${found.id}`;
        if (!sessionStorage.getItem(viewKey)) {
          fetch("/api/increment-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: found.id }),
          }).catch(err => console.error("Erreur vue:", err));
          
          setViewsCount(prev => prev + 1);
          sessionStorage.setItem(viewKey, "true");
        }

        // CHARGEMENT DES COMMENTAIRES
        const resComm = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
        if (resComm.ok) {
          const allComments = await resComm.json();
          const filtered = allComments.filter(c => String(c.textId).trim() === String(found.id).trim());
          setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      }
    } catch (e) {
      console.error("Erreur de synchronisation:", e);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // --- 2. LOGIQUE LIKE (Appel à /api/like) ---
  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer");
    if (hasLiked) return toast.info("Déjà aimé");

    setLikesCount(prev => prev + 1);
    setHasLiked(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: text.id }),
      });

      if (res.ok) {
        const likedTexts = JSON.parse(localStorage.getItem("lisible_liked") || "[]");
        localStorage.setItem("lisible_liked", JSON.stringify([...likedTexts, String(text.id)]));
        toast.success("Vous aimez ce manuscrit !");
      }
    } catch (e) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
      toast.error("Erreur lors du like");
    }
  };

  // --- 3. LOGIQUE COMMENTAIRE (Appel à /api/comment) ---
  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !text) return;
    setIsSubmitting(true);

    const commentData = {
      textId: text.id,
      userName: user.name || user.displayName || "Anonyme",
      userEmail: user.email,
      text: newComment,
      date: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData)
      });

      if (res.ok) {
        setComments([commentData, ...comments]);
        setNewComment("");
        toast.success("Message publié");
      }
    } catch (e) {
      toast.error("Impossible de publier");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. PARTAGE WHATSAPP ---
  const shareWhatsApp = () => {
    const url = window.location.href;
    const msg = `Découvre ce texte sur Lisible : "${text.title}"\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) setReadProgress((window.scrollY / h) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center py-40 bg-slate-50 min-h-screen text-teal-600 font-black tracking-widest uppercase text-[10px]">
      <Loader2 className="animate-spin mb-4" size={32} />
      Ouverture du manuscrit...
    </div>
  );

  if (!text) return (
    <div className="py-40 text-center font-black text-slate-300 uppercase px-6">
      <p className="mb-6">Manuscrit introuvable</p>
      <Link href="/bibliotheque" className="text-teal-500 border border-teal-500 px-6 py-3 rounded-xl">Retour</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-1000">
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-200" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-10 flex justify-between items-center">
        <Link href="/bibliotheque" className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 text-teal-600">
             <Eye size={16} />
             <span className="text-[11px] font-black">{viewsCount}</span>
           </div>
           <div className="w-px h-3 bg-slate-200" />
           <div className="flex items-center gap-2 text-rose-500">
             <Heart size={14} fill={hasLiked ? "currentColor" : "none"} />
             <span className="text-[11px] font-black">{likesCount}</span>
           </div>
        </div>
      </header>

      <article className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-16 space-y-10">
          <div className="space-y-4">
             <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em]">Manuscrit Original</p>
             <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-[0.95]">
               {text.title}
             </h1>
             <div className="flex items-center gap-3 pt-4">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase font-sans">
                  {text.authorName?.charAt(0)}
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">{text.authorName}</span>
             </div>
          </div>

          <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap selection:bg-teal-100">
            {text.content}
          </div>
        </div>

        <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <button 
             onClick={handleLike}
             className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${hasLiked ? 'bg-rose-50 text-rose-500 shadow-inner' : 'bg-white text-slate-400 hover:text-rose-500 shadow-sm'}`}
           >
             <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
             <span className="text-[10px] font-black uppercase tracking-widest">Aimer</span>
           </button>

           <button 
             onClick={shareWhatsApp}
             className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl text-slate-400 hover:text-green-600 shadow-sm transition-all"
           >
             <Share2 size={20} />
             <span className="text-[10px] font-black uppercase tracking-widest">Partager</span>
           </button>
        </footer>
      </article>

      <section className="space-y-8 pt-6">
        <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter flex items-center gap-4">
          <MessageSquare size={28} className="text-teal-500" /> 
          Échanges <span className="text-slate-300 not-italic">({comments.length})</span>
        </h2>

        {user ? (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Qu'avez-vous pensé de cette œuvre ?"
              className="w-full bg-slate-50 rounded-[1.5rem] p-6 text-base min-h-[140px] outline-none border-none focus:ring-2 focus:ring-teal-500/10 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-teal-600 transition-all disabled:opacity-30 shadow-xl"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publier
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Link href="/login" className="text-xs font-black text-teal-600 uppercase tracking-widest hover:underline">
              Connectez-vous pour laisser une trace
            </Link>
          </div>
        )}

        <div className="grid gap-6">
          {comments.map((c, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-50 flex gap-6 transition-all shadow-sm">
              <div className="w-12 h-12 shrink-0 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-black text-xl uppercase font-sans">
                {c.userName?.charAt(0)}
              </div>
              <div className="space-y-2 flex-grow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">{c.userName}</span>
                  <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                    {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
