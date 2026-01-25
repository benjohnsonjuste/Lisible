"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  Heart, Share2, Send, ArrowLeft, Eye, 
  Loader2, Edit3, Check, X 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation"; // Utilisation du hook direct pour éviter les erreurs de params

export default function TextPage() {
  const params = useParams(); // Récupère l'ID directement de l'URL
  const id = params?.id;

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef(null);

  // Chargement des données
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        // 1. Récupérer l'utilisateur
        const loggedUser = localStorage.getItem("lisible_user");
        if (loggedUser) setUser(JSON.parse(loggedUser));

        // 2. Récupérer le texte depuis GitHub
        const url = `https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error("Fichier introuvable");
        }

        const data = await res.json();
        setText(data);
        setEditTitle(data.title);
        setEditContent(data.content);
        
        // 3. Likes locaux
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);

        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("Erreur chargement:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Gestion du scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      setReadProgress((current / total) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUpdateContent = async () => {
    if (!editTitle.trim() || !editContent.trim()) return toast.error("Champs vides");
    setIsSaving(true);
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          type: 'update_content',
          payload: { title: editTitle.trim(), content: editContent.trim() } 
        })
      });

      if (res.ok) {
        setText(prev => ({ ...prev, title: editTitle, content: editContent }));
        setIsEditing(false);
        toast.success("Mise à jour réussie !");
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Erreur de sauvegarde sur GitHub");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (isLiked) return;
    setIsAnimating(true);
    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'like' })
      });
      if (res.ok) {
        setIsLiked(true);
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
        const likes = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        localStorage.setItem("lisible_likes", JSON.stringify([...likes, id]));
      }
    } catch (e) { toast.error("Erreur"); }
    finally { setTimeout(() => setIsAnimating(false), 1000); }
  };

  if (error) return (
    <div className="py-40 text-center space-y-4">
      <div className="text-slate-300 font-black uppercase italic tracking-widest text-xs">Texte introuvable</div>
      <Link href="/bibliotheque" className="text-teal-600 font-bold text-[10px] uppercase">Retour à la bibliothèque</Link>
    </div>
  );

  if (loading || !text) return (
    <div className="flex flex-col items-center py-40 text-teal-600">
      <Loader2 className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">Récupération du manuscrit...</span>
    </div>
  );

  const isOwner = user && user.email === text.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-700">
      {/* Barre de lecture */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-slate-100">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <header className="pt-4 flex justify-between items-center">
        <Link href="/bibliotheque" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> Bibliothèque
        </Link>
        
        {isOwner && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all"
          >
            <Edit3 size={14} /> Modifier mon texte
          </button>
        )}
      </header>

      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-teal-400 font-black shadow-lg">
                {text.authorName?.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auteur</p>
                <p className="text-sm font-black text-slate-900 italic">{text.authorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-600 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <input 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-2xl font-black text-slate-900 italic bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500"
              />
              <textarea 
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full min-h-[400px] text-slate-800 leading-relaxed font-serif text-lg bg-slate-50 p-6 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500 resize-none"
              />
              <div className="flex gap-2 justify-end pt-4">
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase bg-slate-100 text-slate-400">Annuler</button>
                <button onClick={handleUpdateContent} disabled={isSaving} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase bg-teal-600 text-white shadow-lg">
                  {isSaving ? "Enregistrement..." : "Confirmer les changements"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">{text.title}</h1>
              {text.imageBase64 && <img src={text.imageBase64} className="w-full h-auto rounded-3xl shadow-sm my-6" alt="Couverture" />}
              <div className="text-slate-800 leading-relaxed font-serif text-xl md:text-2xl whitespace-pre-wrap pt-4">{text.content}</div>
            </>
          )}
        </div>

        {!isEditing && (
          <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-3">
              <button 
                onClick={handleLike} 
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isLiked ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
                {text.likesCount || 0}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-100 transition-colors">
                <Share2 size={20}/>
              </button>
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Publié le {text.date ? new Date(text.date).toLocaleDateString('fr-FR') : "Date inconnue"}
            </span>
          </footer>
        )}
      </article>
    </div>
  );
}
