"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TextPage({ params }) {
  const { id } = params;
  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger le texte depuis GitHub au démarrage
  useEffect(() => {
    const fetchText = async () => {
      try {
        // On utilise l'URL raw pour lire le contenu public
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger le texte.");
      }
    };

    if (id) fetchText();
  }, [id]);

  // Gérer le Like avec persistance GitHub
  const handleLike = async () => {
    if (isLiked) return;

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
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
        toast.success("Merci pour votre like !");
      }
    } catch (err) {
      console.error("Erreur de sauvegarde du like");
    }
  };

  // Gérer le partage (Mobile et Desktop)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: text.title,
          text: `Découvrez ce texte sur Lisible : ${text.title}`,
          url: window.location.href,
        });
      } catch (err) { console.log("Partage annulé"); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  // Gérer l'envoi de commentaire sur GitHub
  const handleComment = async () => {
    if (!comment.trim()) return toast.error("Le commentaire ne peut pas être vide");
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Enregistrement du commentaire...");

    const newComment = {
      id: Date.now(),
      authorName: authorName.trim() || "Anonyme",
      message: comment,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });

      if (!res.ok) throw new Error();

      setText(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setComment("");
      toast.success("Commentaire ajouté !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur de connexion avec GitHub", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!text) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-gray-500 italic">Chargement du texte...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white min-h-screen">
      {/* Bouton Retour */}
      <Link href="/librarybook" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft size={20} />
        <span>Retour à la bibliothèque</span>
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-3">{text.title}</h1>
        <div className="flex items-center gap-2 text-blue-600 font-semibold bg-blue-50 w-fit px-4 py-1 rounded-full">
          <User size={16} />
          <span>{text.authorName}</span>
        </div>
      </header>

      {text.imageBase64 && (
        <div className="relative w-full h-80 mb-10">
          <img 
            src={text.imageBase64} 
            alt={text.title} 
            className="w-full h-full object-cover rounded-3xl shadow-xl"
          />
        </div>
      )}

      <article className="prose prose-lg text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap font-serif">
        {text.content}
      </article>

      {/* Barre d'interaction */}
      <div className="flex items-center justify-between py-6 border-t border-b border-gray-100 mb-12">
        <div className="flex gap-8">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all group ${isLiked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}
          >
            <div className={isAnimating ? "animate-bounce" : "group-active:scale-125 transition-transform"}>
               <Heart size={30} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl">{text.likesCount || 0}</span>
          </button>

          <button onClick={handleShare} className="text-gray-400 hover:text-blue-500 transition-colors">
            <Share2 size={28} />
          </button>
        </div>
        
        <div className="text-right text-gray-400 text-xs font-medium uppercase tracking-widest">
          {new Date(text.date || text.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Section Commentaires */}
      <section className="bg-gray-50 rounded-[2.5rem] p-8">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-gray-900">
          <MessageSquare size={24} className="text-blue-600" />
          Commentaires ({(text.comments || []).length})
        </h3>

        <div className="space-y-4 mb-10">
          <input
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Votre nom (facultatif)"
            disabled={isSubmitting}
            className="w-full px-5 py-3 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
          />
          <div className="relative">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Écrire un commentaire..."
              disabled={isSubmitting}
              className="w-full px-5 py-4 rounded-[1.5rem] border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[120px] bg-white resize-none"
            />
            <button 
              onClick={handleComment}
              disabled={isSubmitting}
              className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {text.comments && text.comments.length > 0 ? (
            text.comments.slice().reverse().map((c, index) => (
              <div key={index} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 transition-hover hover:border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    {c.authorName}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 text-md leading-relaxed">{c.message}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4 italic">Soyez le premier à commenter ce texte.</p>
          )}
        </div>
      </section>
    </div>
  );
}
