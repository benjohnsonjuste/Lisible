"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, Share2, ArrowLeft, Eye, Loader2, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

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
      // 1. Récupération des données avec cache-bust pour voir les derniers commentaires
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Manuscrit introuvable");
      
      const fileData = await res.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      // 2. LOGIQUE VUE UNIQUE : On ne déclenche l'API que si c'est une nouvelle session
      const viewKey = `lisible_view_${textId}`;
      if (!localStorage.getItem(viewKey)) {
        await fetch("/api/texts", { 
          method: "PATCH", 
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ id: textId, action: "view" }) 
        });
        localStorage.setItem(viewKey, "true");
        // Mise à jour visuelle immédiate pour l'utilisateur
        setText(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
      }
    } catch (e) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [textId]);

  useEffect(() => { 
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));
    fetchData(); 
  }, [fetchData]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer");
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: textId, action: "like", payload: { email: user.email } })
    });
    if (res.ok) {
      const updated = await res.json();
      setText(updated);
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
          payload: { 
            userName: user.penName || user.name, 
            text: newComment,
            date: new Date().toISOString() 
          } 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setText(updated); // Met à jour l'état avec le nouveau tableau de commentaires
        setNewComment("");
        toast.success("Commentaire publié !");
      }
    } catch (e) {
      toast.error("Échec de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-40"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-400">Texte introuvable</div>;

  const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12">
      <header className="pt-10">
        <Link href="/bibliotheque" className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em]">
          <ArrowLeft size={16}/> Bibliothèque
        </Link>
      </header>
      
      <article className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-slate-50 relative">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] text-slate-900 mb-10">{text.title}</h1>

        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16">
          {paragraphs.map((para, index) => (
            <React.Fragment key={index}>
              <p className={`mb-8 whitespace-pre-wrap ${index === 0 ? "first-letter:text-6xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-3 first-letter:float-left" : ""}`}>
                {para}
              </p>
              {index === 1 && <InTextAd />}
            </React.Fragment>
          ))}
        </div>
        
        <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
              <Eye size={18} className="text-teal-500"/> 
              <span className="font-black text-xs text-slate-600">{text.views || 0}</span>
            </div>
            <button onClick={handleLike} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
              <Heart size={18} className={text.likes?.includes(user?.email) ? "text-rose-500 fill-rose-500" : ""} />
              <span className="font-black text-xs">{text.likes?.length || 0}</span>
            </button>
          </div>
          <span className="text-teal-600 font-black italic">@{text.authorName}</span>
        </div>
      </article>

      {/* --- SECTION ÉCHANGES (COMMENTAIRES) --- */}
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
                className="w-full bg-slate-50 rounded-3xl p-6 min-h-[140px] outline-none border-none focus:ring-2 ring-teal-500/10 transition-all" 
                placeholder="Écrivez votre ressenti ici..." 
              />
              <div className="flex justify-end">
                <button 
                  onClick={handlePostComment} 
                  disabled={isSubmitting || !newComment.trim()} 
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-30"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} 
                  Publier
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Link href="/login" className="text-teal-600 font-black text-[10px] uppercase border-b-2 border-teal-600 pb-1">S'identifier pour commenter</Link>
            </div>
          )}
        </div>

        {/* AFFICHAGE DES COMMENTAIRES PUBLIÉS */}
        <div className="space-y-6">
          {text.comments && text.comments.length > 0 ? (
            [...text.comments].reverse().map((c, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm animate-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-[11px] uppercase text-teal-600">{c.userName}</span>
                  <span className="text-[9px] text-slate-300 font-bold uppercase">
                    {c.date ? new Date(c.date).toLocaleDateString() : 'Récemment'}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-slate-300 uppercase text-[10px] font-black tracking-widest">Aucun commentaire pour le moment.</p>
          )}
        </div>
      </section>
    </div>
  );
}
