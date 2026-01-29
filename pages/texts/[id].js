"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, Share2, ArrowLeft, Eye, Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
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
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Manuscrit introuvable");
      const fileData = await res.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      const viewKey = `v_u_${textId}`;
      if (!localStorage.getItem(viewKey)) {
        await fetch("/api/texts", { 
          method: "PATCH", 
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ id: textId, action: "view" }) 
        });
        localStorage.setItem(viewKey, "true");
        setText(prev => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
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
      const isLikingNow = updated.likes.includes(user.email);
      setText(updated);
      
      // NOTIFICATION DE LIKE
      if (isLikingNow && user.email !== text.authorEmail) {
        await fetch("/api/create-notif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "like",
            message: `${user.penName || user.name} a aimé votre œuvre "${text.title}"`,
            targetEmail: text.authorEmail,
            link: `/texts/${textId}`
          })
        });
      }
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
          payload: { userName: user.penName || user.name, text: newComment, date: new Date().toISOString() } 
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setText(updated);
        
        // NOTIFICATION DE COMMENTAIRE
        if (user.email !== text.authorEmail) {
          await fetch("/api/create-notif", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "comment",
              message: `${user.penName || user.name} a commenté votre œuvre "${text.title}"`,
              targetEmail: text.authorEmail,
              link: `/texts/${textId}`
            })
          });
        }

        setNewComment("");
        toast.success("Commentaire publié !");
      }
    } catch (e) { 
      toast.error("Échec de la publication"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Immersion...</p>
    </div>
  );
  
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-300 tracking-widest">Manuscrit introuvable</div>;

  const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
      <header className="pt-12 flex justify-between items-center">
        <Link href="/bibliotheque" className="group text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
        </Link>
        <div className="flex items-center gap-2 text-teal-600/40">
           <Sparkles size={14} fill="currentColor"/>
           <span className="text-[9px] font-black uppercase tracking-[0.3em]">Lecture Premium</span>
        </div>
      </header>
      
      <article className="bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-50 relative overflow-hidden">
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-[0.85] text-slate-900 mb-12 break-words">
          {text.title}
        </h1>
        
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16 selection:bg-teal-100">
          {paragraphs.map((para, index) => (
            <React.Fragment key={index}>
              <p className={`mb-10 whitespace-pre-wrap ${index === 0 ? "first-letter:text-7xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-4 first-letter:float-left first-letter:leading-[0.8]" : ""}`}>
                {para}
              </p>
              {index === 1 && <div className="my-12"><InTextAd /></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100/50">
              <Eye size={18} className="text-teal-500"/> 
              <span className="font-black text-xs text-slate-600">{text.views || 0}</span>
            </div>
            
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all active:scale-90 ${text.likes?.includes(user?.email) ? 'bg-rose-50 text-rose-500 border border-rose-100 shadow-sm' : 'bg-slate-50 border border-slate-100/50 hover:bg-slate-100'}`}
            >
              <Heart size={18} fill={text.likes?.includes(user?.email) ? "currentColor" : "none"}/> 
              <span className="font-black text-xs">{text.likes?.length || 0}</span>
            </button>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Auteur</p>
             <span className="text-teal-600 font-black italic text-xl">@{text.authorName}</span>
          </div>
        </div>
      </article>

      <section className="space-y-10 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black italic flex items-center gap-4 text-slate-900">
          <MessageSquare className="text-teal-500" size={28} /> Échanges 
        </h2>
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl">
          {user ? (
            <div className="space-y-6">
              <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full bg-slate-50 rounded-[2rem] p-8 min-h-[160px] outline-none border border-slate-100 focus:bg-white transition-all" placeholder="Laissez une trace..." />
              <div className="flex justify-end">
                <button onClick={handlePostComment} disabled={isSubmitting || !newComment.trim()} className="bg-slate-900 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Publier
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-slate-400 font-bold uppercase text-[10px]">Connectez-vous pour commenter</p>
          )}
        </div>

        <div className="space-y-8">
          {text.comments && [...text.comments].reverse().map((c, i) => (
            <div key={i} className="group bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-[12px] uppercase text-slate-900 tracking-wider">{c.userName}</span>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-6 border-l-4 border-teal-50 group-hover:border-teal-500 transition-colors">{c.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
