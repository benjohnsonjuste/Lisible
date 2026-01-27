"use client";
import { useEffect, useState, use } from "react";
import { Heart, Share2, Send, MessageCircle, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function Detail({ params: paramsPromise }) {
  // On déballe les params pour récupérer l'ID proprement
  const params = use(paramsPromise);
  const textId = params.id;

  const [item, setItem] = useState(null);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));

    async function load() {
      try {
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
        if (!res.ok) throw new Error("Texte introuvable");
        
        const file = await res.json();
        // Décodage UTF-8 sûr pour les accents
        const content = JSON.parse(decodeURIComponent(escape(atob(file.content))));
        setItem(content);

        // Compteur de vue automatique (une seule fois par session)
        const hasViewed = sessionStorage.getItem(`viewed_${textId}`);
        if (!hasViewed) {
          fetch("/api/texts", { 
            method: "PATCH", 
            headers: {"Content-Type":"application/json"}, 
            body: JSON.stringify({ id: textId, action: "view" })
          });
          sessionStorage.setItem(`viewed_${textId}`, "true");
        }
      } catch (err) {
        toast.error("Erreur lors du chargement du manuscrit.");
      }
    }
    load();
  }, [textId]);

  const handleLike = async () => {
    if (!user) return toast.error("Connectez-vous pour aimer !");
    
    // Animation locale immédiate pour le ressenti High-Tech
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ 
        id: textId, 
        action: "like", 
        payload: { email: user.email }
      })
    });

    if (res.ok) {
      const updated = await res.json();
      setItem(updated);
      toast.success(updated.likes.includes(user.email) ? "Coup de cœur ajouté !" : "Coup de cœur retiré.");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    if (!user) return toast.error("Veuillez vous connecter.");

    setLoadingAction(true);
    const res = await fetch("/api/texts", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ 
        id: textId, 
        action: "comment", 
        payload: { userName: user.penName || user.name, text: comment }
      })
    });

    if (res.ok) {
      setItem(await res.json());
      setComment("");
      toast.success("Votre commentaire est en ligne !");
    }
    setLoadingAction(false);
  };

  if (!item) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Analyse du manuscrit...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/bibliotheque" className="group inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-teal-600 transition-all">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Retour à la Bibliothèque
      </Link>
      
      <article className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 overflow-hidden">
        {item.imageBase64 && (
          <div className="h-80 w-full overflow-hidden">
            <img src={item.imageBase64} className="w-full h-full object-cover" alt={item.title} />
          </div>
        )}
        
        <div className="p-8 md:p-14 space-y-8">
          <header className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-[1.1] text-slate-900">
              {item.title}
            </h1>
            
            <div className="flex justify-between items-center py-6 border-y border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auteur</span>
                <span className="text-teal-600 font-black italic text-lg">@{item.authorName}</span>
              </div>
              
              <div className="flex gap-5 text-slate-400 font-bold text-xs">
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl">
                  <Eye size={16} className="text-teal-500"/> {item.views}
                </span>
                <button 
                  onClick={handleLike} 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-125 ${item.likes?.includes(user?.email) ? 'bg-rose-50 text-rose-500' : 'bg-slate-50'}`}
                >
                  <Heart size={16} fill={item.likes?.includes(user?.email) ? "currentColor" : "none"}/> 
                  {item.likes?.length || 0}
                </button>
              </div>
            </div>
          </header>

          <div className="font-serif text-xl leading-relaxed text-slate-700 whitespace-pre-line first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left">
            {item.content}
          </div>

          <button 
            onClick={() => window.open(`https://wa.me/?text=Découvre ce texte sur Lisible : "${item.title}" %0A%0A ${window.location.href}`)} 
            className="w-full py-6 bg-[#25D366] text-white rounded-[2rem] font-black flex justify-center items-center gap-3 shadow-xl hover:shadow-green-200 transition-all active:scale-[0.98]"
          >
            <Share2 size={20}/> PARTAGER SUR WHATSAPP
          </button>
        </div>
      </article>

      <section className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
        <h3 className="text-xl font-black italic mb-10 flex items-center gap-3">
          <MessageCircle className="text-teal-400" /> {item.comments?.length || 0} Commentaires
        </h3>

        <div className="space-y-6 mb-12 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {item.comments?.length > 0 ? (
            item.comments.map((c, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 animate-in fade-in duration-500">
                <p className="text-teal-400 font-black text-[10px] uppercase tracking-widest mb-2">{c.userName}</p>
                <p className="text-slate-300 font-medium leading-relaxed">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic text-center py-4">Soyez le premier à laisser une trace...</p>
          )}
        </div>

        {user ? (
          <div className="relative group">
            <input 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Écrire votre ressenti..." 
              className="w-full bg-white/10 border-2 border-white/5 rounded-2xl p-6 outline-none focus:border-teal-500/50 focus:bg-white/15 transition-all pr-20 text-white placeholder:text-slate-500"
            />
            <button 
              onClick={handleComment}
              disabled={loadingAction || !comment.trim()}
              className="absolute right-3 top-3 p-4 bg-teal-500 text-white rounded-xl hover:bg-teal-400 transition-all disabled:opacity-50"
            >
              {loadingAction ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
            </button>
          </div>
        ) : (
          <div className="text-center p-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-slate-400 text-sm italic">Connectez-vous pour rejoindre la discussion.</p>
          </div>
        )}
      </section>
    </div>
  );
}
