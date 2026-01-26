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
  const id = params?.id;

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [readProgress, setReadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // États pour les commentaires
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const storedUser = localStorage.getItem("lisible_user");
        const userData = storedUser ? JSON.parse(storedUser) : null;
        setUser(userData);

        // 1. Charger le texte
        const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
        const dataText = await resText.json();
        const found = dataText.find(t => String(t.id) === String(id));
        
        if (found) {
          setText(found);
          window.scrollTo(0, 0);
          
          // 2. Charger les commentaires liés à ce texte
          const resComments = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
          if (resComments.ok) {
            const allComments = await resComments.json();
            const filtered = allComments.filter(c => String(c.textId) === String(id));
            setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);

    const commentData = {
      textId: id,
      userName: user.name || user.displayName || "Lecteur Anonyme",
      userEmail: user.email,
      text: newComment,
      date: new Date().toISOString()
    };

    try {
      // Simulation d'envoi vers ton API de mise à jour GitHub
      // Remplace l'URL par ta route API réelle
      const res = await fetch("/api/commentaires/add", {
        method: "POST",
        body: JSON.stringify(commentData)
      });

      if (res.ok) {
        setComments([commentData, ...comments]);
        setNewComment("");
        toast.success("Commentaire publié");
      }
    } catch (e) {
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const updateProgress = () => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH > 0) setReadProgress((window.scrollY / scrollH) * 100);
    };
    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center py-40 text-teal-600 bg-slate-50 min-h-screen">
      <Loader2 className="animate-spin mb-4" size={32} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Ouverture du manuscrit...</span>
    </div>
  );

  const isOwner = user && user.email === text?.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-700">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-8 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        {isOwner && (
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
            <Edit3 size={14} /> Modifier
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-14 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl">
                {text.authorName?.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Manuscrit</p>
                <p className="text-base font-black text-slate-900 italic leading-none">{text.authorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
          <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">{text.content}</div>
        </div>

        {!isEditing && (
          <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
               <Heart size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Aimer</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-teal-500 transition-colors">
               <Share2 size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Partager</span>
            </button>
          </footer>
        )}
      </article>

      {/* --- SECTION COMMENTAIRES --- */}
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
              placeholder="Qu'avez-vous ressenti à la lecture ?"
              className="w-full bg-slate-50 rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publier
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100/50 p-8 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-medium mb-4">Rejoignez le cercle Lisible pour commenter.</p>
            <Link href="/login" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Se connecter</Link>
          </div>
        )}

        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="w-10 h-10 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black text-sm">
                {c.userName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{c.userName}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(c.date).toLocaleDateString('fr-FR')}
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
