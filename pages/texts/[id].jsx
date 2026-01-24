"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router"; 
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send, ArrowLeft, Lock, Eye } from "lucide-react";
import Link from "next/link";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;

  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) setUser(JSON.parse(loggedUser));

    if (!id) return;

    const fetchText = async () => {
      try {
        const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json?t=${Date.now()}`);
        if (!res.ok) throw new Error("Texte introuvable");
        const data = await res.json();
        setText(data);
        
        // Vérifier Like
        const likedTexts = JSON.parse(localStorage.getItem("lisible_likes") || "[]");
        if (likedTexts.includes(id)) setIsLiked(true);

        // LOGIQUE DE VUE UNIQUE (Monétisation)
        const viewKey = `v_${id}`;
        if (!localStorage.getItem(viewKey)) {
          await fetch('/api/increment-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorEmail: data.authorEmail })
          });
          localStorage.setItem(viewKey, "true");
        }
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

        // Notification à l'auteur
        await fetch('/api/push-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'like',
            message: `${user?.name || "Quelqu'un"} a aimé votre texte "${text.title}"`,
            targetEmail: text.authorEmail,
            link: `/texts/${id}`
          })
        });
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
      authorName: user.name,
      message: comment.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/update-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment', payload: newComment })
      });
      
      if (res.ok) {
        setText(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
        setComment("");
        toast.success("Commentaire publié !", { id: loadingToast });

        // Notification à l'auteur
        await fetch('/api/push-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'comment',
            message: `${user.name} a commenté votre texte "${text.title}"`,
            targetEmail: text.authorEmail,
            link: `/texts/${id}`
          })
        });
      }
    } catch (err) {
      toast.error("Erreur d'envoi", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!text) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 bg-white min-h-screen">
      <Link href="/bibliotheque" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 mb-8 font-bold text-sm">
        <ArrowLeft size={18} /> <span>Retour</span>
      </Link>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{text.title}</h1>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 font-bold bg-blue-50 px-4 py-1.5 rounded-2xl text-sm">
                <User size={16} /> <span>{text.authorName}</span>
            </div>
            {/* Badge de vue pour l'esthétique */}
            <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                <Eye size={14} /> <span>Lecture en cours</span>
            </div>
        </div>
      </header>

      {text.imageBase64 && (
        <img src={text.imageBase64} alt="" className="w-full h-auto rounded-[2.5rem] mb-10 shadow-2xl shadow-gray-100 border border-gray-50" />
      )}

      <article className="prose prose-blue text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap font-serif text-lg">
        {text.content}
      </article>

      {/* Interactions */}
      <div className="flex items-center justify-between py-6 border-y border-gray-100 mb-12">
        <div className="flex gap-6">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={28} fill={isLiked ? "currentColor" : "none"} className={isAnimating ? "animate-bounce" : ""} />
            <span className="font-black text-xl">{text.likesCount || 0}</span>
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Lien copié !"); }} className="text-gray-400 hover:text-blue-500 transition-colors">
            <Share2 size={26} />
          </button>
        </div>
        <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
          Publié le {new Date(text.date).toLocaleDateString()}
        </div>
      </div>

      {/* Commentaires */}
      <section className="bg-gray-50 rounded-[3rem] p-6 md:p-10 shadow-inner">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-900">
          <MessageSquare size={22} className="text-blue-600" />
          Commentaires ({(text.comments || []).length})
        </h3>

        <div className="mb-10">
          {user ? (
            <div className="relative">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Votre avis compte..."
                className="w-full px-6 py-5 rounded-[2rem] border-none outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 shadow-sm min-h-[140px]"
              />
              <button 
                onClick={handleComment}
                disabled={isSubmitting || !comment.trim()}
                className="absolute bottom-4 right-4 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-300"
              >
                <Send size={20} />
              </button>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] text-center">
              <p className="text-gray-500 font-bold mb-4">Connectez-vous pour rejoindre la conversation.</p>
              <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm inline-block">Connexion</Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 transition-transform hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-blue-600 text-xs uppercase tracking-wider">{c.authorName}</span>
                <span className="text-[10px] text-gray-300 font-bold">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
