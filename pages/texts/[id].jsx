"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Share2, User, MessageSquare, Send } from "lucide-react";

export default function TextPage({ params }) {
  const { id } = params;
  const [text, setText] = useState(null);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Charger le texte depuis GitHub
  const fetchText = async () => {
    try {
      // On récupère le JSON brut depuis GitHub
      const res = await fetch(`https://raw.githubusercontent.com/benjohnsonjuste/Lisible/main/data/publications/${id}.json`);
      if (!res.ok) throw new Error("Texte introuvable");
      const data = await res.json();
      setText(data);
    } catch (err) {
      toast.error("Erreur de chargement");
    }
  };

  useEffect(() => {
    if (id) fetchText();
  }, [id]);

  const handleLike = async () => {
    if (isLiked) return; // Empêche le clic multiple si déjà liké

    setIsLiked(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);

    // Note: Pour sauvegarder le like sur GitHub, il faudrait une route API 
    // qui récupère le JSON, incrémente likesCount, et re-commit.
    setText(prev => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
    toast.success("Merci pour votre like !");
  };

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

  const handleComment = async () => {
    if (!comment.trim()) return toast.error("Le commentaire ne peut pas être vide");
    
    const newComment = {
      id: Date.now(),
      authorName: authorName.trim() || "Anonyme",
      message: comment,
      createdAt: new Date().toISOString()
    };

    // Mise à jour locale immédiate
    setText(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));
    
    setComment("");
    toast.success("Commentaire ajouté !");
  };

  if (!text) return <div className="flex justify-center mt-20 italic">Chargement du texte...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 bg-white min-h-screen shadow-sm">
      {/* En-tête */}
      <header className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-2">{text.title}</h1>
        <div className="flex items-center gap-2 text-blue-600 font-medium">
          <User size={18} />
          <span>{text.authorName}</span>
        </div>
      </header>

      {/* Image (si elle existe) */}
      {text.imageBase64 && (
        <img 
          src={text.imageBase64} 
          alt={text.title} 
          className="w-full h-auto rounded-3xl mb-8 shadow-lg"
        />
      )}

      {/* Contenu */}
      <article className="prose prose-lg text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap">
        {text.content}
      </article>

      {/* Barre d'interaction flottante ou fixe */}
      <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 mb-12">
        <div className="flex gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <div className={isAnimating ? "animate-ping" : ""}>
               <Heart size={28} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg">{text.likesCount || 0}</span>
          </button>

          <button onClick={handleShare} className="text-gray-400 hover:text-blue-500 transition-colors">
            <Share2 size={26} />
          </button>
        </div>
        
        <div className="text-gray-400 text-sm italic">
          Publié le {new Date(text.date || text.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Espace Commentaires */}
      <section className="bg-gray-50 rounded-3xl p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <MessageSquare size={20} />
          Commentaires ({(text.comments || []).length})
        </h3>

        <div className="space-y-4 mb-8">
          <input
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Votre nom (facultatif)"
            className="w-full px-4 py-2 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <div className="relative">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Qu'en avez-vous pensé ?"
              className="w-full px-4 py-3 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px]"
            />
            <button 
              onClick={handleComment}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Liste des commentaires */}
        <div className="space-y-4">
          {(text.comments || []).slice().reverse().map((c, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-900">{c.authorName}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  {new Date(c.createdAt).toLocaleDateString()}
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
