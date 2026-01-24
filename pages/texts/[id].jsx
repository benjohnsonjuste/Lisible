"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router"; 
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null); // Utilisateur connecté
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Vérifier la session locale
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    }

    if (!id) return;

    // 2. Vérifier si déjà liké
    const checkLikeStatus = () => {
      const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
      if (likedTexts.includes(id)) setIsLiked(true);
    };

    // 3. Charger le texte
    const fetchText = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        checkLikeStatus();
      } catch (err) {
        toast.error("Impossible de charger le texte.");
      }
    };

    fetchText();
  }, [id]);

  const handleLike = async () => {
    if (isLiked || !text) return;
    setIsLiked(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'like' })
      });
      if (res.ok) {
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        likedTexts.push(id);
        localStorage.setItem("lisible_likes", JSON.stringify(likedTexts));
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      }
    } catch (err) {
      setIsLiked(false);
    }
  };

  const handleComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter");
    if (!comment.trim()) return toast.error("Commentaire vide");

    setIsSubmitting(true);
    const loadingToast = toast.loading("Envoi du commentaire...");

    const newComment = {
      id: Date.now(),
      authorName: user.name, // Nom automatique de la session
      message: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });
      if (!res.ok) throw new Error();
      
      setText(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setComment("");
      toast.success("Commentaire publié !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur de connexion avec GitHub", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!text) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white min-h-screen shadow-sm">
      <Link href="/bibliotheque" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-8 transition-colors font-bold text-sm">
        <ArrowLeft size={18} />
        <span>Bibliothèque</span>
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{text.title}</h1>
        <div className="flex items-center gap-2 text-blue-700 font-bold bg-blue-50 px-4 py-1.5 rounded-2xl w-fit text-sm">
          <User size={16} />
          <span>{text.authorName}</span>
        </div>
      </header>

      {text.imageBase64 && (
        <img src={text.imageBase64} alt="" className="w-full h-auto rounded-[2rem] mb-10 shadow-xl shadow-gray-100" />
      )}

      <article className="prose prose-blue text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap font-serif text-lg">
        {text.content}
      </article>

      {/* Barre d'interaction */}
      <div className="flex items-center justify-between py-6 border-y border-gray-100 mb-12">
        <div className="flex gap-6">
          <button 
            onClick={handleLike} 
            disabled={isLiked}
            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} className={isAnimating ? "animate-ping" : ""} />
            <span className="font-black text-xl">{text.likesCount || 0}</span>
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Lien copié !");
          }} className="text-gray-400 hover:text-blue-500 transition-colors">
            <Share2 size={26} />
          </button>
        </div>
        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
          {text.date ? new Date(text.date).toLocaleDateString() : ""}
        </div>
      </div>

      {/* Section Commentaires */}
      <section className="bg-gray-50 rounded-[2.5rem] p-6 md:p-8">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-900">
          <MessageSquare size={22} className="text-blue-600" />
          Commentaires ({(text.comments || []).length})
        </h3>

        {/* Formulaire de commentaire conditionnel */}
        <div className="mb-10">
          {user ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 ml-2 uppercase">Connecté en tant que {user.name}</p>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Écrivez votre avis..."
                  className="w-full px-5 py-4 rounded-[1.5rem] border-none outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[120px] bg-white text-gray-800 shadow-sm"
                />
                <button 
                  onClick={handleComment}
                  disabled={isSubmitting || !comment.trim()}
                  className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-600 p-8 rounded-[2rem] text-center space-y-4 shadow-xl shadow-blue-100">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Lock size={20} className="text-white" />
              </div>
              <p className="text-white font-bold">Connectez-vous pour participer à la discussion.</p>
              <Link href="/login" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-black text-sm hover:bg-gray-100 transition-colors">
                Se connecter
              </Link>
            </div>
          )}
        </div>

        {/* Liste des commentaires */}
        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-blue-600 text-sm">{c.authorName}</span>
                <span className="text-[10px] text-gray-300 font-bold">
                   {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
