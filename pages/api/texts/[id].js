"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Heart, Share2, ArrowLeft, Eye, Loader2, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TextPage() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id) : null;

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);
    try {
      // 1. Récupérer le texte (Anti-cache avec Date.now)
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
      const data = await res.json();
      
      // Recherche de l'ID (extrait l'ID si l'URL est 123-titre-du-texte)
      const cleanId = String(rawId).split('-')[0];
      const found = data.find(t => String(t.id) === cleanId);
      
      if (found) {
        setText(found);
        // Incrémenter la vue automatiquement
        fetch("/api/increment-view", { method: "POST", body: JSON.stringify({ id: found.id }) });

        // 2. Récupérer les commentaires
        const resComm = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
        const allComm = await resComm.json();
        setComments(allComm.filter(c => String(c.textId) === String(found.id)));
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/commentaires/add", {
        method: "POST",
        body: JSON.stringify({ textId: text.id, text: newComment, date: new Date().toISOString() })
      });
      if (res.ok) {
        setComments([{ text: newComment, date: new Date() }, ...comments]);
        setNewComment("");
        toast.success("Message envoyé");
      }
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="py-40 text-center font-black uppercase text-[10px] tracking-widest text-teal-600">Chargement...</div>;
  if (!text) return <div className="py-40 text-center font-black uppercase text-[10px]">Texte introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12">
      <header className="pt-10"><Link href="/bibliotheque" className="text-slate-400 font-black text-[10px] uppercase flex items-center gap-2"><ArrowLeft size={16}/> Bibliothèque</Link></header>
      
      <article className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-slate-100">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-8">{text.title}</h1>
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">{text.content}</div>
        
        <div className="mt-12 pt-8 border-t border-slate-50 flex gap-6 text-slate-400">
          <div className="flex items-center gap-2"><Eye size={20}/> <span className="font-black text-xs">{text.views || 0}</span></div>
          <button onClick={() => fetch("/api/like", { method: "POST", body: JSON.stringify({id: text.id}) }).then(() => toast.success("Cœur envoyé"))} className="flex items-center gap-2 hover:text-rose-500 transition-colors"><Heart size={20}/> <span className="font-black text-xs">{text.likes || 0}</span></button>
        </div>
      </article>

      <section className="space-y-6">
        <h2 className="text-2xl font-black italic">Échanges</h2>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
          <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} className="w-full bg-slate-50 rounded-2xl p-4 min-h-[100px] outline-none border-none mb-4" placeholder="Votre ressenti..." />
          <button onClick={handlePostComment} disabled={isSubmitting} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
            {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Publier
          </button>
        </div>
        {comments.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm">
            <p className="text-slate-600 text-sm">{c.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
