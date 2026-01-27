"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, Share2, ArrowLeft, Eye, Loader2, MessageSquare, Send } from "lucide-react";
import Link from "next/link";

export default function TextPage() {
  const params = useParams();
  const textId = params?.id;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const fetchData = useCallback(async () => {
    if (!textId) return;
    try {
      // Récupération via l'API GitHub (avec anti-cache)
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Manuscrit introuvable");
      
      const fileData = await res.json();
      // Décodage Base64 sécurisé pour les accents
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      // Incrémentation automatique de la vue
      fetch("/api/texts", { 
        method: "PATCH", 
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: textId, action: "view" }) 
      });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'ouverture du texte");
    } finally {
      setLoading(false);
    }
  }, [textId]);

  useEffect(() => { 
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));
    if (textId) fetchData(); 
  }, [textId, fetchData]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer ce texte");
    
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ 
        id: textId, 
        action: "like", 
        payload: { email: user.email } 
      })
    });

    if (res.ok) {
      const updated = await res.json();
      setText(updated);
      toast.success(updated.likes.includes(user.email) ? "Coup de cœur envoyé !" : "Cœur retiré.");
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/texts", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ 
          id: textId, 
          action: "comment", 
          payload: { userName: user.penName || user.name, text: newComment } 
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setText(updated);
        setNewComment("");
        toast.success("Commentaire publié");
      }
    } catch (e) {
      toast.error("Erreur lors de la publication");
    } finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Analyse du manuscrit...</p>
    </div>
  );

  if (!text) return <div className="py-40 text-center font-black uppercase text-[10px] text-slate-400">Texte introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-700">
      <header className="pt-10">
        <Link href="/bibliotheque" className="group text-slate-400 hover:text-teal-600 transition-colors font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em]">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Bibliothèque
        </Link>
      </header>
      
      <article className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-slate-50 relative overflow-hidden">
        <div className="mb-10 flex justify-between items-start">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] text-slate-900">
            {text.title}
          </h1>
          <button 
            onClick={() => window.open(`https://wa.me/?text=Lis cette œuvre sur Lisible : "${text.title}" %0A%0A ${window.location.href}`)} 
            className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-green-500 transition-all active:scale-90"
          >
            <Share2 size={24}/>
          </button>
        </div>

        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap mb-16 first-letter:text-6xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-3 first-letter:float-left">
          {text.content}
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
              <Eye size={18} className="text-teal-500"/> 
              <span className="font-black text-xs text-slate-600">{text.views || 0}</span>
            </div>
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-125 ${text.likes?.includes(user?.email) ? 'bg-rose-50 text-rose-500' : 'bg-slate-50'}`}
            >
              <Heart size={18} fill={text.likes?.includes(user?.email) ? "currentColor" : "none"}/> 
              <span className="font-black text-xs">{text.likes?.length || 0}</span>
            </button>
          </div>
          <div className="text-right">
            <span className="text-teal-600 font-black italic text-lg">@{text.authorName}</span>
          </div>
        </div>
      </article>

      <section className="space-y-8">
        <h2 className="text-2xl font-black italic flex items-center gap-3">
          <MessageSquare className="text-teal-500" /> Échanges ({text.comments?.length || 0})
        </h2>
        
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          {user ? (
            <div className="space-y-4">
              <textarea 
                value={newComment} 
                onChange={(e)=>setNewComment(e.target.value)} 
                className="w-full bg-slate-50 rounded-3xl p-6 min-h-[140px] outline-none border-none focus:ring-2 ring-teal-500/20 transition-all font-medium" 
                placeholder="Votre ressenti..." 
              />
              <div className="flex justify-end">
                <button 
                  onClick={handlePostComment} 
                  disabled={isSubmitting || !newComment.trim()} 
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-teal-600 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} 
                  Publier
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-slate-400 italic">Connectez-vous pour commenter.</p>
          )}
        </div>

        <div className="space-y-6">
          {text.comments?.length > 0 ? (
            [...text.comments].reverse().map((c, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-[11px] uppercase tracking-tighter text-teal-600">{c.userName}</span>
                  <span className="text-[9px] text-slate-300 font-bold uppercase">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-slate-300 uppercase text-[10px] font-black tracking-widest">Aucun message pour le moment</p>
          )}
        </div>
      </section>
    </div>
  );
}
