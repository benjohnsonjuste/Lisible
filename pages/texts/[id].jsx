"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // Import correct pour Pages Router
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query; // Récupération de l'ID depuis l'URL

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return; // Attendre que l'ID soit disponible

    const fetchText = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
      } catch (err) {
        console.error(err);
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
        setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      }
    } catch (err) {
      console.error("Erreur Like");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: text?.title,
          url: window.location.href,
        });
      } catch (err) { console.log("Annulé"); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return toast.error("Commentaire vide");
    setIsSubmitting(true);
    const loadingToast = toast.loading("Envoi...");

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
      setText(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setComment("");
      toast.success("Commentaire ajouté !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur GitHub", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empêche le crash si le texte n'est pas encore chargé
  if (!text) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-400 italic">Chargement du contenu...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white min-h-screen">
      <Link href="/bibliotheque" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft size={20} />
        <span>Retour</span>
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{text.title}</h1>
        <div className="flex items-center gap-2 text-blue-600 font-semibold bg-blue-50 w-fit px-4 py-1 rounded-full text-sm">
          <User size={14} />
          <span>{text.authorName}</span>
        </div>
      </header>

      {text.imageBase64 && (
        <img src={text.imageBase64} alt="" className="w-full h-auto rounded-3xl mb-8 shadow-lg" />
      )}

      <article className="prose prose-lg text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap font-serif">
        {text.content}
      </article>

      <div className="flex items-center justify-between py-6 border-t border-b border-gray-100 mb-12">
        <div className="flex gap-8">
          <button onClick={handleLike} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}>
            <div className={isAnimating ? "animate-bounce" : ""}>
               <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl">{text.likesCount || 0}</span>
          </button>
          <button onClick={handleShare} className="text-gray-400 hover:text-blue-500">
            <Share2 size={26} />
          </button>
        </div>
        <div className="text-gray-400 text-xs uppercase tracking-widest font-bold">
          {text.date ? new Date(text.date).toLocaleDateString('fr-FR') : ""}
        </div>
      </div>

      <section className="bg-gray-50 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-600" />
          Commentaires ({(text.comments || []).length})
        </h3>

        <div className="space-y-4 mb-8">
          <input
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Votre nom"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm"
          />
          <div className="relative">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[100px] bg-white text-sm resize-none"
            />
            <button 
              onClick={handleComment}
              disabled={isSubmitting}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-900 text-sm">{c.authorName}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                   {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
