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

  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [readProgress, setReadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);

    try {
      const storedUser = localStorage.getItem("lisible_user");
      setUser(storedUser ? JSON.parse(storedUser) : null);

      // Fetch avec timestamp pour éviter le cache GitHub
      const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${new Date().getTime()}`);
      const dataText = await resText.json();
      
      // LOGIQUE DE RECHERCHE ULTRA-PERMISSIVE
      const urlString = String(rawId).toLowerCase();
      
      const found = dataText.find(t => {
          const jsonId = String(t.id).toLowerCase().trim();
          // Vérifie si l'ID du JSON est au début de l'URL ou si l'URL contient l'ID
          return urlString.startsWith(jsonId) || urlString.includes(jsonId);
      });
      
      if (found) {
        setText(found);
        
        // Charger les commentaires
        const resComm = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${new Date().getTime()}`);
        if (resComm.ok) {
          const allComm = await resComm.json();
          const filtered = allComm.filter(c => String(c.textId).trim() === String(found.id).trim());
          setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      }
    } catch (e) {
      console.error("Erreur de récupération:", e);
      toast.error("Erreur de connexion aux données");
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

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
    try {
      const res = await fetch("/api/commentaires/add", {
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
        setComments([{ userName: user.name, text: newComment, date: new Date().toISOString() }, ...comments]);
        setNewComment("");
        toast.success("Commentaire publié");
      }
    } catch (e) { toast.error("Erreur"); } finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 min-h-screen text-teal-600 font-black uppercase text-[10px] tracking-widest">
      <Loader2 className="animate-spin mb-4" size={32} /> Synchronisation...
    </div>
  );

  if (!text) return (
    <div className="py-40 text-center px-6 min-h-screen flex flex-col items-center justify-center">
      <p className="font-black text-slate-300 uppercase text-[10px] mb-8 tracking-widest">Manuscrit introuvable</p>
      <Link href="/bibliotheque" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Retourner à la bibliothèque</Link>
    </div>
  );

  const isOwner = user && user.email === text.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-700">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-8 flex justify-between items-center">
        <Link href="/bibliotheque" className="text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase flex items-center gap-2 tracking-widest">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        {isOwner && <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Modifier</button>}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden p-8 md:p-14">
        <div className="flex items-center justify-between border-b border-slate-50 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl">
              {text.authorName?.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Auteur</p>
              <p className="text-base font-black text-slate-900 italic">{text.authorName || "Anonyme"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500">
            <Eye size={14} className="text-teal-500" />
            <span className="text-xs font-black">{text.views || 0}</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-[1.1] mb-8">{text.title}</h1>
        <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">{text.content}</div>
        
        <footer className="mt-12 pt-8 border-t border-slate-50 flex justify-between">
          <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
            <Heart size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Aimer</span>
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié"); }} className="flex items-center gap-2 text-slate-400 hover:text-teal-500">
            <Share2 size={20} /> <span className="text-[10px] font-black uppercase tracking-widest">Partager</span>
          </button>
        </footer>
      </article>

      {/* SECTION COMMENTAIRES */}
      <section className="space-y-8">
        <h2 className="text-2xl font-black italic tracking-tighter">Échanges ({comments.length})</h2>
        {user ? (
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 space-y-4">
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Votre avis..." className="w-full bg-slate-50 rounded-2xl p-4 min-h-[100px] outline-none border-none resize-none" />
            <div className="flex justify-end">
              <button onClick={handlePostComment} disabled={!newComment.trim() || isSubmitting} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 tracking-widest">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publier
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
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-4">
              <div className="w-10 h-10 shrink-0 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black">{c.userName?.charAt(0) || "L"}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black">{c.userName}</span>
                  <span className="text-[8px] text-slate-300 uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 text-sm">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
