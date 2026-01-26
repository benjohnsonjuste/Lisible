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

  // 1. CHARGEMENT DU TEXTE ET DES COMMENTAIRES
  useEffect(() => {
    const fetchPageData = async () => {
      if (!id) return;
      
      setLoading(true);
      setText(null); // Reset pour éviter de voir l'ancien texte

      try {
        const storedUser = localStorage.getItem("lisible_user");
        const userData = storedUser ? JSON.parse(storedUser) : null;
        setUser(userData);

        // Récupération du texte
        const resText = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/textes.json?t=${Date.now()}`);
        const dataText = await resText.json();
        const found = dataText.find(t => String(t.id) === String(id));
        
        if (found) {
          setText(found);
          window.scrollTo(0, 0);
          
          // Récupération des commentaires liés à ce texte
          const resComments = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/commentaires.json?t=${Date.now()}`);
          if (resComments.ok) {
            const allComments = await resComments.json();
            const filtered = allComments.filter(c => String(c.textId) === String(id));
            // Trier du plus récent au plus ancien
            setComments(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
        } else {
          toast.error("Manuscrit introuvable.");
        }
      } catch (e) {
        console.error("Erreur chargement:", e);
        toast.error("Erreur de connexion aux serveurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [id]); // Se relance dès que l'ID change (clic sur notification)

  // 2. LOGIQUE D'ENVOI DE COMMENTAIRE
  const handlePostComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);

    const commentData = {
      textId: id,
      userName: user.name || user.displayName || "Lecteur Lisible",
      userEmail: user.email,
      text: newComment,
      date: new Date().toISOString()
    };

    try {
      // APPEL À TON API QUI ÉCRIT SUR GITHUB
      const res = await fetch("/api/commentaires/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData)
      });

      if (res.ok) {
        setComments([commentData, ...comments]); // Ajout instantané à l'écran
        setNewComment("");
        toast.success("Votre message a été publié.");
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Impossible de publier le commentaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. BARRE DE PROGRESSION DE LECTURE
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

  if (!text) return <div className="py-40 text-center font-bold text-slate-400">Texte introuvable.</div>;

  const isOwner = user && user.email === text?.authorEmail;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20 space-y-12 animate-in fade-in duration-700">
      {/* Barre de progression fixe */}
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

      {/* --- L'ARTICLE --- */}
      <article className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-14 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-50 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-teal-400 font-black text-xl uppercase">
                {text.authorName?.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Auteur</p>
                <p className="text-base font-black text-slate-900 italic leading-none">{text.authorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-500 border border-slate-100">
              <Eye size={14} className="text-teal-500" />
              <span className="text-xs font-black">{text.views || 0}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-tight">
            {text.title}
          </h1>
          
          {text.imageBase64 && (
            <img src={text.imageBase64} className="w-full h-auto rounded-[2rem] shadow-sm my-4" alt="Couverture" />
          )}

          <div className="text-slate-800 leading-[1.8] font-serif text-xl md:text-2xl whitespace-pre-wrap">
            {text.content}
          </div>
        </div>

        <footer className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
             <Heart size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Aimer</span>
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-teal-500 transition-colors">
             <Share2 size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Partager</span>
          </button>
        </footer>
      </article>

      {/* --- SECTION ÉCHANGES (COMMENTAIRES) --- */}
      <section className="space-y-8 pt-10">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-teal-500" size={24} />
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Échanges ({comments.length})</h2>
        </div>

        {/* Zone de saisie : visible uniquement si connecté */}
        {user ? (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-4">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase">
                 {user.name?.charAt(0) || user.displayName?.charAt(0)}
               </div>
               <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                 {user.name || user.displayName}
               </span>
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Qu'avez-vous pensé de ce manuscrit ?"
              className="w-full bg-slate-50 rounded-2xl p-5 text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-teal-500/20 transition-all border-none"
            />
            <div className="flex justify-end">
              <button 
                onClick={handlePostComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-teal-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publier le commentaire
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100/50 p-10 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-bold mb-6 italic">Connectez-vous pour rejoindre la discussion.</p>
            <Link href="/login" className="inline-block bg-white border border-slate-200 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-900 hover:text-white transition-all">
              Se connecter
            </Link>
          </div>
        )}

        {/* Liste des messages publiés */}
        <div className="space-y-6">
          {comments.map((c, i) => (
            <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 flex gap-5 animate-in slide-in-from-bottom-3 duration-500 shadow-sm">
              <div className="w-12 h-12 shrink-0 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg uppercase">
                {c.userName?.charAt(0)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">{c.userName}</span>
                  <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em]">
                    {new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-slate-600 text-base leading-relaxed font-medium">{c.text}</p>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <p className="text-center py-10 text-slate-300 text-xs font-black uppercase tracking-widest italic">Soyez le premier à laisser une trace.</p>
          )}
        </div>
      </section>
    </div>
  );
}
