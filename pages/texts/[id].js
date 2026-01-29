"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Heart, ArrowLeft, Eye, Loader2, MessageSquare, Send, Sparkles, Share2, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";
import { InTextAd } from "@/components/InTextAd";

export default function TextPage() {
  const router = useRouter();
  const { id: textId } = router.query;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // --- FONCTION DE PARTAGE UNIVERSEL (TOUT INTERNET) ---
  const handleGlobalShare = async () => {
    const shareData = {
      title: text?.title || "Lisible",
      text: `Découvrez "${text?.title}" par ${text?.authorName} sur Lisible.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié ! Partagez-le sur vos réseaux.");
      }
    } catch (err) {
      if (err.name !== "AbortError") toast.error("Erreur de partage");
    }
  };

  const fetchData = useCallback(async (id) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Manuscrit introuvable");
      
      const fileData = await res.json();
      // Décodage Base64 robuste (UTF-8)
      const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
      setText(content);

      // Gestion des vues
      const viewKey = `v_u_${id}`;
      if (!localStorage.getItem(viewKey)) {
        await fetch("/api/texts", { 
          method: "PATCH", 
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ id: id, action: "view" }) 
        });
        localStorage.setItem(viewKey, "true");
        setText(prev => (prev ? { ...prev, views: (prev.views || 0) + 1 } : null));
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (router.isReady && textId) {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setUser(JSON.parse(logged));
      fetchData(textId); 
    }
  }, [router.isReady, textId, fetchData]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer cette œuvre");
    try {
      const res = await fetch("/api/texts", {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: textId, action: "like", payload: { email: user.email } })
      });
      if (res.ok) {
        const updated = await res.json();
        setText(updated);
      }
    } catch (e) { toast.error("Action impossible"); }
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
        setNewComment("");
        toast.success("Commentaire publié !");
      }
    } catch (e) { toast.error("Échec"); } finally { setIsSubmitting(false); }
  };

  if (loading || !router.isReady) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Immersion...</p>
    </div>
  );
  
  if (!text) return <div className="py-40 text-center font-black uppercase text-slate-300 tracking-widest">Manuscrit introuvable</div>;

  const paragraphs = text.content.split('\n').filter(p => p.trim() !== "");
  const isConcours = text.isConcours === true || text.isConcours === "true";

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16 animate-in fade-in duration-1000">
      
      {/* HEADER : RETOUR ET ACCÈS BIBLIOTHÈQUE */}
      <header className="pt-12 flex justify-between items-center">
        <button onClick={() => router.back()} className="group text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] hover:text-teal-600 transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour
        </button>
        
        <Link href="/bibliotheque" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/20">
           <BookOpen size={14}/> Bibliothèque
        </Link>
      </header>
      
      <article className="bg-white rounded-[4rem] p-10 md:p-20 shadow-2xl border border-slate-50 relative overflow-hidden">
        {/* BADGE CONCOURS SI APPLICABLE */}
        {isConcours && (
          <div className="mb-8 inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse border border-teal-400 shadow-lg shadow-teal-500/20">
            <Trophy size={16} /> Battle Poétique International
          </div>
        )}

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

        {/* BARRE D'ACTIONS : VUES, LIKES ET PARTAGE */}
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

            {/* BOUTON PARTAGE GLOBAL */}
            <button 
              onClick={handleGlobalShare}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 hover:bg-teal-600 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <Share2 size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Partager</span>
            </button>
          </div>

          <div className="text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {isConcours ? "ID Concurrent" : "Auteur"}
             </p>
             <div className="text-teal-600 font-black italic text-2xl">
               @{text.authorName}
             </div>
          </div>
        </div>
      </article>

      {/* SECTION DES COMMENTAIRES */}
      <section className="space-y-10 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black italic flex items-center gap-4 text-slate-900">
          <MessageSquare className="text-teal-500" size={28} /> Échanges 
        </h2>
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl">
          {user ? (
            <div className="space-y-6">
              <textarea 
                value={newComment} 
                onChange={(e)=>setNewComment(e.target.value)} 
                className="w-full bg-slate-50 rounded-[2rem] p-8 min-h-[160px] outline-none border border-slate-100 focus:bg-white transition-all text-slate-700" 
                placeholder="Laissez une trace de votre lecture..." 
              />
              <div className="flex justify-end">
                <button 
                  onClick={handlePostComment} 
                  disabled={isSubmitting || !newComment.trim()} 
                  className="bg-slate-900 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center gap-3 shadow-xl"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Publier
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Connectez-vous pour commenter</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {text.comments && [...text.comments].reverse().map((c, i) => (
            <div key={i} className="group bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-[12px] uppercase text-slate-900 tracking-wider">{c.userName}</span>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-6 border-l-4 border-teal-50 group-hover:border-teal-500 transition-colors italic">
                "{c.text}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
