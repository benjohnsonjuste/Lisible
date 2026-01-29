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

  // --- TA LOGIQUE DE RÉCUPÉRATION (GARDÉE À 100%) ---
  const fetchData = useCallback(async () => {
    if (!textId) return;
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Manuscrit introuvable");
      
      const fileData = await res.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      // Logique vue unique (localStorage)
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

  // --- NOUVELLE FONCTION : PARTAGE UNIVERSEL ---
  const handleShare = async () => {
    const shareData = {
      title: text.title,
      text: `Découvrez "${text.title}" de ${text.authorName} sur Lisible.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié !");
      }
    } catch (err) { console.error(err); }
  };

  // --- TA GESTION DES LIKES (GARDÉE À 100%) ---
  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer");
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: textId, action: "like", payload: { email: user.email } })
    });

    if (res.ok) {
      const updated = await res.json();
      const isLiking = updated.likes.includes(user.email);
      setText(updated);
      if (isLiking && user.email !== text.authorEmail) {
        await fetch("/api/create-notif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "like",
            message: `${user.penName || user.name} a aimé "${text.title}"`,
            targetEmail: text.authorEmail,
            link: `/texts/${textId}`
          })
        });
      }
    }
  };

  // --- TA GESTION DES COMMENTAIRES (GARDÉE À 100%) ---
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
        setText(updated);
        setNewComment("");
        toast.success("Commentaire publié !");
        if (user.email !== text.authorEmail) {
          await fetch("/api/create-notif", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "comment",
              message: `${user.penName || user.name} a commenté votre œuvre`,
              targetEmail: text.authorEmail,
              link: `/texts/${textId}`
            })
          });
        }
      }
    } catch (e) { toast.error("Échec"); } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-40"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-400">Texte introuvable</div>;

  const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12">
      <header className="pt-10">
        <Link href="/bibliotheque" className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-colors">
          <ArrowLeft size={16}/> Bibliothèque
        </Link>
      </header>
      
      <article className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl border border-slate-50 relative">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] text-slate-900 mb-10">{text.title}</h1>
        
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl mb-16">
          {paragraphs.map((para, index) => (
            <React.Fragment key={index}>
              <p className={`mb-8 whitespace-pre-wrap ${index === 0 ? "first-letter:text-6xl first-letter:font-black first-letter:text-teal-600 first-letter:mr-3 first-letter:float-left" : ""}`}>{para}</p>
              {index === 1 && <InTextAd />}
            </React.Fragment>
          ))}
        </div>

        {/* BARRE D'ACTIONS TECHNIQUE & VISUELLE */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/50">
              <Eye size={18} className="text-teal-500"/> <span className="font-black text-xs text-slate-600">{text.views || 0}</span>
            </div>
            
            <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95 ${text.likes?.includes(user?.email) ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 border border-slate-100/50'}`}>
              <Heart size={18} fill={text.likes?.includes(user?.email) ? "currentColor" : "none"}/> <span className="font-black text-xs">{text.likes?.length || 0}</span>
            </button>

            {/* LE BOUTON DE PARTAGE PARTOUT */}
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
              <Share2 size={18} className="text-teal-400" />
              <span className="font-black text-[10px] uppercase tracking-widest hidden sm:block">Diffuser</span>
            </button>
          </div>
          
          <span className="text-teal-600 font-black italic text-lg px-4 py-1 bg-teal-50/50 rounded-full border border-teal-100/50">@{text.authorName}</span>
        </div>
      </article>

      {/* SECTION ÉCHANGES (GARDÉE À 100%) */}
      <section className="space-y-8">
        <h2 className="text-2xl font-black italic flex items-center gap-3"><MessageSquare className="text-teal-500" /> Échanges ({text.comments?.length || 0})</h2>
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
          {user ? (
            <div className="space-y-4">
              <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full bg-slate-50 rounded-3xl p-6 min-h-[140px] outline-none border border-slate-100 focus:border-teal-500/30 transition-all" placeholder="Votre ressenti..." />
              <div className="flex justify-end">
                <button onClick={handlePostComment} disabled={isSubmitting || !newComment.trim()} className="bg-slate-900 text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Publier
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4"><Link href="/login" className="text-teal-600 font-black text-[10px] uppercase border-b-2 border-teal-600 pb-1 hover:text-slate-900 transition-colors">S'identifier pour commenter</Link></div>
          )}
        </div>

        <div className="space-y-6">
          {text.comments && text.comments.length > 0 ? (
            [...text.comments].reverse().map((c, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm transition-all hover:translate-x-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-[11px] uppercase text-teal-600 tracking-wider">{c.userName}</span>
                  <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{c.date ? new Date(c.date).toLocaleDateString() : 'Récemment'}</span>
                </div>
                <p className="text-slate-600 leading-relaxed font-medium pl-4 border-l-2 border-slate-100">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-slate-300 uppercase text-[10px] font-black tracking-widest border-2 border-dashed border-slate-50 rounded-[2rem]">Aucun commentaire pour le moment.</p>
          )}
        </div>
      </section>

      <footer className="text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Une production La Belle Littéraire</p>
      </footer>
    </div>
  );
}
