"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  ArrowLeft, Loader2, Share2, Eye, Heart, Trophy, 
  ShieldCheck, Sparkles, Send, MessageCircle 
} from "lucide-react";

// --- IMPORT DU COMPOSANT EXTÉRIEUR ---
import { InTextAd } from "@/components/InTextAd";

// --- 1. COMPOSANT : BADGE CONCOURS ---
function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in duration-500">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">Candidat Officiel - Battle Poétique</span>
    </div>
  );
}

// --- 2. COMPOSANT : SCEAU DE CERTIFICATION (SYSTÈME LI) ---
function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount, authorEmail, textTitle }) {
  const [seconds, setSeconds] = useState(Math.max(5, Math.floor(wordCount / 60)));
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const totalTime = Math.max(5, Math.floor(wordCount / 60));

  useEffect(() => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) setIsValidated(true);
  }, [fileName]);

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
      const resText = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: fileName, 
          action: "certify", 
          payload: { readerEmail: userEmail || "anonymous@lisible.biz" } 
        })
      });

      if (resText.ok) {
        if (authorEmail) {
          await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authorEmail,
              amount: 1,
              reason: `Lecture certifiée : ${textTitle}`
            })
          });
        }
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

        <div onClick={validate} className={`absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${
            isValidated ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-rose-900/20 hover:scale-105 active:scale-95'
          }`}>
          {isValidated ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
              <ShieldCheck size={42} className="text-white mb-1" />
              <span className="text-[8px] font-black text-white tracking-widest uppercase">Certifié</span>
            </div>
          ) : (
            <div className="text-center text-white">
              <span className="block font-black text-xl italic tracking-tighter mb-1">LISIBLE</span>
              <span className="block text-[9px] font-black uppercase tracking-[0.2em]">{seconds > 0 ? `${seconds}S` : "SCELLER"}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 bg-white border border-slate-100 shadow-sm px-6 py-3 rounded-2xl">
        <Sparkles size={16} className="text-teal-500" />
        <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">
          {certifiedCount || 0} Lecture(s) Certifiée(s)
        </span>
      </div>
    </div>
  );
}

// --- 3. COMPOSANT : SECTION COMMENTAIRES ---
function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter.");
    if (msg.trim().length < 3) return;
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: textId, action: "comment",
          payload: { userEmail: user.email, userName: user.penName || user.firstName || "Plume", text: msg.trim(), date: new Date().toISOString() }
        })
      });
      if (res.ok) { 
        setMsg(""); 
        onCommented(); 
        toast.success("Commentaire publié"); 
      }
    } catch (e) { toast.error("Erreur de connexion"); }
    finally { setSending(false); }
  };

  return (
    <div className="mt-20 pt-10 border-t border-slate-100">
      <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 text-slate-900">
        <MessageCircle className="text-teal-600" /> Salon de discussion
      </h3>
      <div className="flex gap-4 mb-12">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          placeholder={user ? "Votre pensée..." : "Connectez-vous pour commenter"} 
          disabled={!user || sending}
          className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-4 focus:ring-teal-500/10 disabled:opacity-50" 
        />
        <button 
          onClick={postComment} 
          disabled={sending || !user} 
          className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all disabled:bg-slate-200"
        >
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
      <div className="space-y-6">
        {comments.slice().reverse().map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm transition-all hover:border-teal-100 animate-in slide-in-from-bottom-2">
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

// --- 4. PAGE PRINCIPALE ---
export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);

  const fetchData = useCallback(async (textId) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(content);
        return content;
      }
    } catch (e) { console.error("Fetch error", e); }
  }, []);

  const handleLike = async () => {
    const likeKey = `like_${id}`;
    if (localStorage.getItem(likeKey)) return toast.info("Vous appréciez déjà ce texte.");
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "like" })
      });
      if (res.ok) {
        localStorage.setItem(likeKey, "true");
        await fetchData(id);
        toast.success("Appréciation enregistrée !");
      }
    } catch (e) { toast.error("Action impossible"); }
    finally { setIsLiking(false); }
  };

  useEffect(() => {
    if (router.isReady && id) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));

      fetchData(id).then((loaded) => {
        if (loaded) {
          const viewKey = `view_${id}`;
          if (!localStorage.getItem(viewKey)) {
            fetch('/api/texts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, action: "view" })
            }).then(r => { if(r.ok) localStorage.setItem(viewKey, "true") });
          }
        }
      });
    }
  }, [router.isReady, id, fetchData]);

  const handleShare = () => {
    if (!text) return;
    if (navigator.share) {
      navigator.share({ title: text.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  };

  if (!text) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chargement...</p>
    </div>
  );

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
        {(text.isConcours === true || text.isConcours === "true") && <BadgeConcours />}
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-6 leading-[0.9] text-slate-900">{text.title}</h1>
        <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em] mb-16 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-teal-600"></span> 
            {text.isConcours ? `Concurrent ${text.authorName}` : `Par ${text.authorName}`}
        </p>
        <div className="prose prose-xl font-serif text-slate-800 leading-relaxed mb-24 whitespace-pre-wrap">
          {text.content}
        </div>
      </article>

      <div className="flex justify-center mb-16">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className="group flex flex-col items-center gap-2 scale-110 active:scale-95 transition-transform"
          >
            <div className={`p-6 rounded-full shadow-xl transition-all ${isLiking ? 'bg-slate-100' : 'bg-rose-50 hover:bg-rose-100 shadow-rose-500/10'}`}>
                <Heart size={32} className={`transition-colors ${isLiking ? 'text-slate-300' : 'text-rose-500 fill-rose-500 animate-bounce'}`} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                {text.totalLikes || 0} { (text.totalLikes || 0) > 1 ? "Appréciations" : "Appréciation" }
            </span>
          </button>
      </div>

      <SceauCertification 
        wordCount={text.content ? text.content.trim().split(/\s+/).length : 0} 
        fileName={id} 
        userEmail={user?.email} 
        authorEmail={text.authorEmail}
        textTitle={text.title}
        onValidated={() => fetchData(id)} 
        certifiedCount={text.totalCertified}
      />

      <InTextAd />

      <CommentSection 
        textId={id} 
        comments={text.comments || []} 
        user={user} 
        onCommented={() => fetchData(id)} 
      />
    </div>
  );
}
