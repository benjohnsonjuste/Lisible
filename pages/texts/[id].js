"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Star, Coins, Gift, Loader2, 
  Share2, MessageCircle, Send, CheckCircle 
} from "lucide-react";

// --- SCEAU DE CERTIFICATION (REMPLACE LE BOUTON) ---
function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount }) {
  const [seconds, setSeconds] = useState(Math.max(5, Math.floor(wordCount / 60)));
  const [isValidated, setIsValidated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isValidated || seconds <= 0) return;
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, isValidated]);

  const validate = async () => {
    if (seconds > 0) return toast.info(`Encore ${seconds}s de lecture requise.`);
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) return toast.error("Lecture déjà certifiée.");

    const t = toast.loading("Apposition du sceau...");
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
        toast.success("Sceau apposé ! +1 Li envoyé à l'auteur.", { id: t });
        onValidated();
      }
    } catch (e) { toast.error("Erreur de connexion", { id: t }); }
  };

  return (
    <div className="my-16 flex flex-col items-center gap-6">
      <div className="max-w-xs text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Sceau d'Authenticité</p>
        <p className="text-xs text-slate-500 leading-relaxed italic">
          Ce sceau confirme votre lecture attentive. En cliquant une fois le temps écoulé, vous offrez 1 Li à l'auteur et soutenez la littérature humaine.
        </p>
      </div>

      <div 
        onClick={validate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-700 shadow-2xl ${
          isValidated ? 'bg-teal-600 rotate-[360deg]' : 'bg-rose-700 hover:scale-110 active:scale-95'
        }`}
      >
        {/* Bordure tournante si en attente */}
        {seconds > 0 && !isValidated && (
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/30 animate-spin-slow"></div>
        )}
        
        <div className="text-center text-white select-none">
          {isValidated ? (
            <CheckCircle size={40} className="mx-auto" />
          ) : (
            <>
              <span className="block font-black text-lg tracking-tighter">LISIBLE</span>
              <span className="block text-[8px] font-bold uppercase tracking-widest">
                {seconds > 0 ? `${seconds}s` : "SCELLER"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100 flex items-center gap-2">
        <Star size={14} className="text-amber-500 fill-amber-500" />
        <span className="text-[11px] font-black text-slate-900 uppercase">
          {certifiedCount || 0} Lectures Certifiées
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
            placeholder="Votre pensée sur cette œuvre..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium outline-none ring-teal-500/10 focus:ring-4"
          />
          <button 
            onClick={postComment}
            disabled={sending}
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all"
          >
            {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs font-bold text-slate-400 mb-10 uppercase tracking-widest">
          Connectez-vous pour laisser une trace
        </div>
      )}

      <div className="space-y-6">
        {comments.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm">
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

  const fetchData = useCallback(async (textId) => {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setText(JSON.parse(decodeURIComponent(escape(atob(data.content)))));
    }
  }, []);

  useEffect(() => {
    if (router.isReady && id) {
      setUser(JSON.parse(localStorage.getItem("lisible_user")));
      fetchData(id);
    }
  }, [router.isReady, id, fetchData]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: text.title,
        text: `Découvrez "${text.title}" sur Lisible`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  if (!text) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      <header className="flex justify-between items-center mb-12">
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={20} />
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
          <Share2 size={16} /> Partager l'œuvre
        </button>
      </header>

      <article>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 leading-none">{text.title}</h1>
        <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mb-12">Par {text.authorName}</p>
        
        <div className="prose prose-xl font-serif text-slate-800 leading-relaxed mb-20 whitespace-pre-wrap">
          {text.content}
        </div>
      </article>

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
