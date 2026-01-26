"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, ArrowLeft, Eye, 
  Loader2, Edit3, MessageSquare, Send 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TextPage() {
  const params = useParams();
  // On s'assure que l'ID est bien récupéré et nettoyé
  const rawId = params?.id ? decodeURIComponent(params.id) : null;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [readProgress, setReadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!rawId) return;
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("lisible_user");
        setUser(storedUser ? JSON.parse(storedUser) : null);

        // 1. Charger le texte avec anti-cache
        const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
        const dataText = await resText.json();
        
        // Recherche souple (ID pur ou ID-titre)
        const found = dataText.find(t => {
            const jsonId = String(t.id).trim();
            const urlId = String(rawId).split('-')[0].trim();
            return jsonId === urlId || jsonId === String(rawId).trim();
        });
        
        if (found) {
          setText(found);
          
          // 2. Charger les commentaires
          const resComm = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
          if (resComm.ok) {
            const allComm = await resComm.json();
            const filtered = allComm.filter(c => String(c.textId).trim() === String(found.id).trim());
            setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
        }
      } catch (e) {
        console.error("Erreur chargement:", e);
        toast.error("Impossible de charger le manuscrit");
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, [rawId]);

  // Gestion de la barre de progression
  useEffect(() => {
    const updateProgress = () => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) setReadProgress((window.scrollY / scrollH) * 100);
    };
    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !text) return;
    setIsSubmitting(true);

    const commentData = {
      textId: text.id,
      userName: user.name || "Lecteur",
      userEmail: user.email,
      text: newComment,
      date: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/commentaires/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData)
      });

      if (res.ok) {
        setComments([commentData, ...comments]);
        setNewComment("");
        toast.success("Commentaire publié");
      }
    } catch (e) {
      toast.error("Erreur de publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 bg-slate-50 min-h-screen text-teal-600">
      <Loader2 className="animate-spin mb-4" size={32} />
      <span className="text-[10px] font-black uppercase tracking-widest">Ouverture...</span>
    </div>
  );

  if (!text) return (
    <div className="py-40 text-center bg-slate-50 min-h-screen px-6">
      <p className="font-black text-slate-300 uppercase text-[10px] mb-6">Manuscrit introuvable</p>
      <Link href="/bibliotheque" className="text-teal-600 font-black text-[10px] uppercase border-b-2 border-teal-600">Retourner à la bibliothèque</Link>
    </div>
  );

  const isOwner = user && user.email === text.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-700">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-8 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        {isOwner && (
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
            <Edit3 size={14} /> Modifier
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-14 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl">
                {text.authorName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Auteur</p>
                <p className="text-base font-black text-slate-900 italic leading-none">{text.authorName || "Anonyme"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
          <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">{text.content}</div>
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
             <Heart size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Aimer</span>
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Lien copié !");
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-500 transition-colors"
          >
             <Share2 size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Partager</span>
          </button>
        </footer>
      </article>

      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-teal-500" size={24} />
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Échanges ({comments.length})</h2>
        </div>

        {user ? (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Qu'avez-vous ressenti ?"
              className="w-full bg-slate-50 rounded-2xl p-4 text-sm min-h-[100px] outline-none border-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-teal-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publier
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
            <Link href="/login" className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Se connecter pour commenter</Link>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black text-sm">
                {c.userName?.charAt(0) || "L"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{c.userName}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
