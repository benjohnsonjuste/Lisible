"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, ArrowLeft, Eye, 
  Loader2, MessageSquare, Send 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TextPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id) : null;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);
    
    try {
      // 1. Utilisateur
      const storedUser = localStorage.getItem("lisible_user");
      setUser(storedUser ? JSON.parse(storedUser) : null);

      // 2. Récupération simple (comme hier)
      const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
      const dataText = await resText.json();
      
      // 3. Identification (Nettoyage de l'ID pour éviter le "Introuvable")
      const found = dataText.find(t => {
          const idTableau = String(t.id).trim();
          const idURL = String(rawId).split('-')[0].trim();
          return idTableau === idURL || idTableau === String(rawId).trim();
      });
      
      if (found) {
        setText(found);
        setLikesCount(Number(found.likes) || 0);
        setViewsCount(Number(found.views) || 0);

        const likedTexts = JSON.parse(localStorage.getItem("lisible_liked") || "[]");
        setHasLiked(likedTexts.includes(String(found.id)));

        // 4. Incrément Vue (Si pas déjà fait cette session)
        const viewKey = `viewed_${found.id}`;
        if (!sessionStorage.getItem(viewKey)) {
          fetch("/api/increment-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: found.id }),
          }).catch(() => null);
          setViewsCount(prev => prev + 1);
          sessionStorage.setItem(viewKey, "true");
        }

        // 5. Commentaires
        const resComm = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
        if (resComm.ok) {
          const allComments = await resComm.json();
          const filtered = allComments.filter(c => String(c.textId).trim() === String(found.id).trim());
          setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      }
    } catch (e) {
      console.error("Erreur chargement:", e);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer");
    if (hasLiked) return;
    setLikesCount(prev => prev + 1);
    setHasLiked(true);
    try {
      await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: text.id }),
      });
      const likedTexts = JSON.parse(localStorage.getItem("lisible_liked") || "[]");
      localStorage.setItem("lisible_liked", JSON.stringify([...likedTexts, String(text.id)]));
    } catch (e) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !text) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textId: text.id,
          userName: user.name || "Lecteur",
          userEmail: user.email,
          text: newComment,
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setComments([{ textId: text.id, userName: user.name || "Lecteur", text: newComment, date: new Date().toISOString() }, ...comments]);
        setNewComment("");
        toast.success("Message publié");
      }
    } catch (e) {
      toast.error("Erreur d'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) setReadProgress((window.scrollY / h) * 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return <div className="py-40 text-center text-teal-600 font-black animate-pulse uppercase text-xs">Ouverture du manuscrit...</div>;

  if (!text) return (
    <div className="py-40 text-center px-6">
      <p className="font-black text-slate-400 uppercase text-[10px] mb-8 tracking-widest">Manuscrit introuvable</p>
      <Link href="/bibliotheque" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Retourner à la bibliothèque</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-500">
      {/* Barre de progression */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-10 flex justify-between items-center">
        <Link href="/bibliotheque" className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="flex items-center gap-1.5 text-teal-600">
             <Eye size={16} /> <span className="text-[11px] font-black">{viewsCount}</span>
           </div>
           <div className="flex items-center gap-1.5 text-rose-500">
             <Heart size={14} fill={hasLiked ? "currentColor" : "none"} /> <span className="text-[11px] font-black">{likesCount}</span>
           </div>
        </div>
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-14 space-y-8">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
          <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">{text.content}</div>
        </div>

        <footer className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <button onClick={handleLike} className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
             <Heart size={20} fill={hasLiked ? "currentColor" : "none"} /> <span className="text-[10px] font-black uppercase">Aimer</span>
           </button>
           <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Lisez "${text.title}" sur Lisible : ${window.location.href}`)}`, '_blank')} className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-green-600">
             <Share2 size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Partager</span>
           </button>
        </footer>
      </article>

      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Échanges ({comments.length})</h2>
        {user ? (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 border border-slate-50">
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Votre avis..." className="w-full bg-slate-50 rounded-xl p-5 text-base min-h-[100px] outline-none border-none resize-none" />
            <div className="flex justify-end">
              <button onClick={handlePostComment} disabled={!newComment.trim() || isSubmitting} className="bg-slate-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-3">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Publier
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-100 rounded-[2rem]">
            <Link href="/login" className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Se connecter pour commenter</Link>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-black uppercase text-xs">{c.userName?.charAt(0)}</div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-black text-slate-900 uppercase">{c.userName}</span>
                  <span className="text-[9px] font-black text-slate-200">{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
