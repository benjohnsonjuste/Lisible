"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, Send, ArrowLeft, Eye, 
  Loader2, Edit3, Check, X 
} from "lucide-react";
import Link from "next/link";

export default function TextPage({ params }) {
  const [id, setId] = useState(null);
  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- NOUVEAUX ÉTATS POUR L'ÉDITION ---
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef(null);
  const viewCountedRef = useRef(false);

  const getDisplayName = (originalName, authorEmail) => {
    if (user && user.email === authorEmail) {
      return user.penName || user.name || originalName;
    }
    return originalName;
  };

  useEffect(() => {
    const getParams = async () => {
      try {
        const resolved = await params;
        if (resolved?.id) setId(resolved.id);
        else setError(true);
      } catch (e) { setError(true); }
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const loggedUser = localStorage.getItem("lisible_user");
        if (loggedUser) setUser(JSON.parse(loggedUser));

        const url = `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Inexistant");
        const data = await res.json();
        setText(data);
        setEditTitle(data.title);
        setEditContent(data.content);
        
        startTimeRef.current = Date.now();
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);
      } catch (err) { setError(true); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // LOGIQUE DE SAUVEGARDE DES MODIFICATIONS
  const handleUpdateContent = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          type: 'update_content', // Nouveau type d'action pour ton API
          payload: { title: editTitle, content: editContent } 
        })
      });

      if (res.ok) {
        setText(prev => ({ ...prev, title: editTitle, content: editContent }));
        setIsEditing(false);
        toast.success("Publication mise à jour !");
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  // (Reste des fonctions handleIncrementView, handleLike, handleComment inchangé...)
  const handleIncrementView = async () => { /* ... idem ... */ };
  const handleLike = async () => { /* ... idem ... */ };
  const handleComment = async () => { /* ... idem ... */ };

  if (error) return <div className="py-40 text-center text-slate-400 font-black uppercase italic tracking-widest text-[10px]">Texte introuvable</div>;
  if (loading || !text) return <div className="flex flex-col items-center py-40 text-teal-600"><Loader2 className="animate-spin mb-4" /><span className="text-[10px] font-black uppercase tracking-widest">Chargement...</span></div>;

  const isOwner = user && user.email === text.authorEmail;
  const currentAuthorName = getDisplayName(text.authorName, text.authorEmail);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-700">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-4 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Retour
        </Link>
        
        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all"
          >
            <Edit3 size={14} /> Modifier
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black uppercase shadow-lg">
                {currentAuthorName?.charAt(0)}
              </div>
              <p className="text-sm font-black text-slate-900 italic">{currentAuthorName}</p>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 border border-slate-100">
                <Eye size={14} className="text-teal-500" />
                <span className="text-xs font-black">{text.views || 0}</span>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <input 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-3xl md:text-4xl font-black text-slate-900 tracking-tighter italic bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500"
                placeholder="Titre..."
              />
              <textarea 
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full min-h-[400px] text-slate-800 leading-relaxed font-serif text-xl md:text-2xl bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500 resize-none"
                placeholder="Écrivez votre texte..."
              />
              <div className="flex gap-2 justify-end pt-4">
                <button 
                  onClick={() => { setIsEditing(false); setEditTitle(text.title); setEditContent(text.content); }}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-100 text-slate-400 flex items-center gap-2"
                >
                  <X size={14} /> Annuler
                </button>
                <button 
                  onClick={handleUpdateContent}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-teal-600 text-white flex items-center gap-2 shadow-lg shadow-teal-900/20"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 
                  Sauvegarder
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
              {text.imageBase64 && <img src={text.imageBase64} className="w-full h-auto rounded-3xl shadow-sm" alt="" />}
              <div className="text-slate-800 leading-relaxed font-serif text-xl md:text-2xl whitespace-pre-wrap pt-4 pb-12">{text.content}</div>
            </>
          )}
        </div>

        {!isEditing && (
          <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-3">
              <button onClick={handleLike} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isLiked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-white text-slate-400 border border-slate-100'}`}>
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
                {text.likesCount || 0}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 transition-colors"><Share2 size={20}/></button>
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{text.date ? new Date(text.date).toLocaleDateString() : ""}</span>
          </footer>
        )}
      </article>

      {/* ... (Reste de la section discussion inchangé) */}
    </div>
  );
}
