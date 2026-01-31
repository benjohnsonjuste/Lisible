"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Star, Coins, Gift, Loader2, 
  Share2, MessageCircle, Send, CheckCircle,
  Eye, Heart, Sparkles, ShieldCheck
} from "lucide-react";

// --- SCEAU DE CERTIFICATION (MODERNE & HIGH-TECH) ---
function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount }) {
  const [seconds, setSeconds] = useState(Math.max(5, Math.floor(wordCount / 60)));
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const totalTime = Math.max(5, Math.floor(wordCount / 60));

  useEffect(() => {
    if (isValidated || seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s - 1;
        setProgress(((totalTime - next) / totalTime) * 100);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, isValidated, totalTime]);

  const validate = async () => {
    if (seconds > 0) return toast.info(`Analyse en cours... ${seconds}s restantes.`);
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) return toast.error("Lecture déjà certifiée.");

    const t = toast.loading("Cryptage du sceau...");
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: fileName, 
          action: "certify", 
          payload: { readerEmail: userEmail || "anonymous@lisible.biz" } 
        })
      });
      if (res.ok) {
        localStorage.setItem(deviceKey, "true");
        setIsValidated(true);
        toast.success("Sceau apposé ! +1 Li envoyé.", { id: t });
        onValidated();
      }
    } catch (e) { toast.error("Échec du protocole", { id: t }); }
  };

  return (
    <div className="my-24 flex flex-col items-center gap-8">
      <div className="relative group">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" 
            strokeDasharray={440} strokeDashoffset={440 - (440 * progress) / 100}
            className={`transition-all duration-1000 ${isValidated ? "text-teal-500" : "text-rose-600"}`}
            strokeLinecap="round"
          />
        </svg>

        <div 
          onClick={validate}
          className={`absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${
            isValidated ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-rose-900/20 hover:scale-105 active:scale-95'
          }`}
        >
          {isValidated ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
              <ShieldCheck size={42} className="text-white mb-1" />
              <span className="text-[8px] font-black text-white tracking-widest uppercase">Certifié</span>
            </div>
          ) : (
            <div className="text-center text-white">
              <span className="block font-black text-xl italic tracking-tighter mb-1">LISIBLE</span>
              <div className="h-[1px] w-8 bg-white/20 mx-auto mb-2" />
              <span className="block text-[9px] font-black uppercase tracking-[0.2em]">
                {seconds > 0 ? `${seconds}S` : "SCELLER"}
              </span>
            </div>
          )}
        </div>
        {!isValidated && seconds === 0 && (
           <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20" />
        )}
      </div>

      <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-sm px-6 py-3 rounded-2xl">
        <Sparkles size={16} className="text-teal-500" />
        <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">
          {certifiedCount || 0} { (certifiedCount || 0) > 1 ? "Lectures Certifiées" : "Lecture Certifiée" }
        </span>
      </div>
    </div>
  );
}

// --- SECTION COMMENTAIRES ---
function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter.");
    if (msg.length < 3) return;
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: textId,
          action: "comment",
          payload: {
            userEmail: user.email,
            userName: user.penName || user.firstName,
            text: msg,
            date: new Date().toISOString()
          }
        })
      });
      if (res.ok) {
        setMsg("");
        onCommented();
        toast.success("Commentaire publié");
      }
    } catch (e) { toast.error("Erreur"); }
    finally { setSending(false); }
  };

  return (
    <div className="mt-20 pt-10 border-t border-slate-100">
      <h3 className="text-xl font-black italic mb-8 flex items-center gap-3">
        <MessageCircle className="text-teal-600" /> Salon de discussion
      </h3>
      {user ? (
        <div className="flex gap-4 mb-12">
          <input 
            value={msg} 
            onChange={e => setMsg(e.target.value)}
            placeholder="Votre pensée..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-teal-500/10"
          />
          <button onClick={postComment} disabled={sending} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all">
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-2xl text-center text-[10px] font-black text-slate-400 mb-10 uppercase tracking-widest">
          Connectez-vous pour laisser un avis
        </div>
      )}
      <div className="space-y-6">
        {comments.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm transition-all hover:border-teal-100">
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-teal-600 uppercase">{c.userName}</span>
              <span className="text-[8px] text-slate-300 font-bold">{new Date(c.date).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- PAGE PRINCIPALE ---
export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);

  const fetchData = useCallback(async (textId) => {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setText(JSON.parse(decodeURIComponent(escape(atob(data.content)))));
    }
  }, []);

  const handleAutoLike = async (textId) => {
    const likeKey = `like_${textId}`;
    if (!localStorage.getItem(likeKey)) {
      setHasLiked(true);
      localStorage.setItem(likeKey, "true");
      try {
        await fetch('/api/texts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: textId, action: "like" })
        });
        // On rafraîchit localement le compteur pour l'UI
        setText(prev => prev ? ({ ...prev, totalLikes: (prev.totalLikes || 0) + 1 }) : null);
      } catch (e) { console.error("Auto-like error", e); }
    } else {
      setHasLiked(true);
    }
  };

  useEffect(() => {
    if (router.isReady && id) {
      setUser(JSON.parse(localStorage.getItem("lisible_user")));
      fetchData(id);

      // 1. COMPTEUR DE VUES AUTOMATIQUE
      const viewKey = `view_${id}`;
      if (!localStorage.getItem(viewKey)) {
        fetch('/api/texts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: "view" })
        }).then(() => localStorage.setItem(viewKey, "true"));
      }

      // 2. APPRÉCIATION (LIKE) AUTOMATIQUE
      handleAutoLike(id);
    }
  }, [router.isReady, id, fetchData]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: text.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (!text) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <header className="flex justify-between items-center mb-16">
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-400">
               <Eye size={14} /> <span className="text-xs font-bold">{text.views || 0}</span>
            </div>
            <button onClick={handleShare} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all">
              <Share2 size={20} />
            </button>
        </div>
      </header>

      <article>
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-6 leading-[0.9]">{text.title}</h1>
        <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em] mb-16 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-teal-600"></span> Par {text.authorName}
        </p>
        <div className="prose prose-xl font-serif text-slate-800 leading-relaxed mb-24 whitespace-pre-wrap selection:bg-teal-100">
          {text.content}
        </div>
      </article>

      <div className="flex justify-center mb-16">
          <div className={`group flex flex-col items-center gap-2 transition-all duration-500 scale-110`}>
            <div className={`p-6 rounded-full transition-all duration-500 bg-rose-50 text-rose-500 shadow-xl shadow-rose-500/10`}>
                <Heart size={32} className="fill-rose-500 animate-bounce" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest text-rose-500`}>
                {text.totalLikes || 0} Appréciations
            </span>
          </div>
      </div>

      <SceauCertification 
        wordCount={text.content.split(/\s+/).length} 
        fileName={id} 
        userEmail={user?.email} 
        onValidated={() => fetchData(id)} 
        certifiedCount={text.totalCertified}
      />

      <CommentSection 
        textId={id} 
        comments={text.comments || []} 
        user={user} 
        onCommented={() => fetchData(id)} 
      />
    </div>
  );
}
