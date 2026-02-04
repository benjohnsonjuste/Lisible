"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import { 
  ArrowLeft, Loader2, Share2, Eye, Heart, Trophy, 
  ShieldCheck, Sparkles, Send, MessageCircle, AlertTriangle 
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";
import ReportModal from "@/components/ReportModal";

// --- COMPOSANT : BADGE CONCOURS ---
function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">Candidat Officiel</span>
    </div>
  );
}

// --- COMPOSANT : SCEAU DE CERTIFICATION ---
function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount }) {
  const waitTime = Math.max(8, Math.floor((wordCount || 50) / 5));
  const [seconds, setSeconds] = useState(waitTime);
  const [isValidated, setIsValidated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const deviceKey = `cert_${fileName}`;
    if (localStorage.getItem(deviceKey)) setIsValidated(true);
  }, [fileName]);

  useEffect(() => {
    if (isValidated || seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s - 1;
        setProgress(((waitTime - next) / waitTime) * 100);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, isValidated, waitTime]);

  const validate = async () => {
    if (seconds > 0) return toast.info(`Attendez ${seconds}s pour certifier votre lecture.`);
    if (isValidated || isProcessing) return;

    setIsProcessing(true);
    const t = toast.loading("Protocole de scellage...");
    
    try {
      const res = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          textId: fileName, 
          readerEmail: userEmail || "anonymous@lisible.biz",
          authorEmail: "" 
        })
      });

      if (res.ok) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé ! Certification réussie.", { id: t });
        onValidated(); 
      }
    } catch (e) { 
      toast.error("Échec de connexion au registre.", { id: t }); 
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="my-20 flex flex-col items-center gap-6">
      <div className="relative group">
        <svg className="w-36 h-36 -rotate-90">
          <circle cx="72" cy="72" r="64" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
          <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={402} strokeDashoffset={402 - (402 * progress) / 100}
            className={`transition-all duration-1000 ${isValidated ? "text-teal-500" : "text-rose-600"}`}
            strokeLinecap="round"
          />
        </svg>

        <div onClick={validate} className={`absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${
            isValidated ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-rose-900/20 hover:scale-105 active:scale-95'
          }`}>
          {isValidated ? (
            <ShieldCheck size={40} className="text-white animate-in zoom-in" />
          ) : (
            <div className="text-center text-white">
              <span className="block text-lg font-black italic tracking-tighter">LISIBLE</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.2em]">
                {seconds > 0 ? `${seconds}S` : "SCELLER"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center gap-3">
        <Sparkles size={14} className="text-teal-500" />
        <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
           {Number(certifiedCount) || 0} CERTIFICATIONS
        </span>
      </div>
    </div>
  );
}

// --- COMPOSANT : SECTION COMMENTAIRES ---
function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous pour commenter.");
    if (msg.trim().length < 2) return;
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: textId, action: "comment",
          payload: { userEmail: user.email, userName: user.penName || "Plume", text: msg.trim(), date: new Date().toISOString() }
        })
      });
      if (res.ok) { 
        setMsg(""); 
        onCommented();
        toast.success("Message publié");
      }
    } catch (e) { toast.error("Erreur de connexion"); }
    finally { setSending(false); }
  };

  return (
    <div className="mt-20">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
        <MessageCircle size={16} /> Flux des Pensées
      </h3>

      <div className="space-y-4 mb-10">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-300 italic uppercase tracking-widest text-center py-4">Soyez le premier à répondre...</p>
        ) : (
          comments.map((c, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-teal-600 uppercase">{c.userName}</span>
                <span className="text-[8px] text-slate-300 font-bold">{new Date(c.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{c.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="sticky bottom-6 flex gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <input 
          value={msg} onChange={e => setMsg(e.target.value)} 
          placeholder="Écrire une réponse..." 
          disabled={!user || sending}
          className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none text-slate-900 dark:text-slate-100" 
        />
        <button onClick={postComment} disabled={sending || !user} className="p-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-20">
          {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}

// --- PAGE PRINCIPALE : LECTURE DU TEXTE ---
export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [liveViews, setLiveViews] = useState(0); // Nouveau : État pour les vues Redis
  const viewLogged = useRef(false);

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const fetchData = useCallback(async (textId, skipCache = false) => {
    if (!textId) return;

    const cacheKey = `cache_text_${textId}`;
    if (!skipCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setText(JSON.parse(cached));
    }

    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${textId}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        localStorage.setItem(cacheKey, JSON.stringify(content));
        setText(content);
        return content;
      }
    } catch (e) { 
      console.error("Erreur de rafraîchissement", e); 
    }
  }, []);

  const handleLike = async () => {
    const likeKey = `like_${id}`;
    if (localStorage.getItem(likeKey)) return toast.info("Vous appréciez déjà ce texte.");
    if (isLiking) return;

    const previousLikes = Number(text.totalLikes || text.likes || 0);
    setText(prev => ({ ...prev, totalLikes: previousLikes + 1 }));
    localStorage.setItem(likeKey, "true");

    setIsLiking(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: "like" })
      });
      if (!res.ok) throw new Error();
      toast.success("Aimé !");
    } catch (e) { 
      setText(prev => ({ ...prev, totalLikes: previousLikes }));
      localStorage.removeItem(likeKey);
      toast.error("Action impossible."); 
    } finally { 
      setIsLiking(false); 
    }
  };

  useEffect(() => {
    if (router.isReady && id) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));
      
      fetchData(id).then(loaded => {
        if (!loaded && !text) return;

        // TRACKING REDIS (Remplace la méthode GitHub lente)
        const viewKey = `view_${id}`;
        if (!localStorage.getItem(viewKey) && !viewLogged.current) {
          viewLogged.current = true;
          fetch('/api/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ textId: id })
          }).then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem(viewKey, "true");
              setLiveViews(data.views); // On met à jour avec le chiffre Redis
            }
          }).catch(() => {
            viewLogged.current = false;
          });
        }
      });
    }
  }, [router.isReady, id, fetchData]);

  if (!text) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4 bg-white dark:bg-slate-950">
      <Loader2 className="animate-spin text-teal-600" size={30} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du manuscrit...</p>
    </div>
  );

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());
  const seoDescription = text.content ? text.content.replace(/<[^>]*>/g, '').substring(0, 155) + "..." : "Découvrez ce manuscrit certifié sur Lisible.";

  return (
    <div className="min-h-screen transition-colors duration-500 bg-white dark:bg-slate-950">
      <Head>
        <title>{`${text.title} | par ${text.authorName || 'Anonyme'} | Lisible`}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://lisible.biz/texte/${id}`} />
        <meta property="og:title" content={`${text.title} — Une œuvre de ${text.authorName || 'Anonyme'}`} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={text.coverImage || "https://lisible.biz/og-card.png"} />
        <meta property="og:site_name" content="Lisible" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={text.title} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={text.coverImage || "https://lisible.biz/og-card.png"} />
        <link rel="canonical" href={`https://lisible.biz/texte/${id}`} />
      </Head>

      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-12 pb-32 overflow-x-hidden">
        <header className="flex justify-between items-center mb-12">
          <button onClick={() => router.back()} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex gap-2">
              {!isStaffText && (
                <>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                     <Eye size={14} /> 
                     <span className="text-[10px] font-black">
                        {/* On affiche en priorité le compteur Redis, sinon celui du JSON */}
                        {liveViews || Number(text.views) || 0}
                     </span>
                  </div>
                  <button 
                    onClick={handleLike} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-90 ${
                      typeof window !== 'undefined' && localStorage.getItem(`like_${id}`) 
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-500' 
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                     <Heart size={14} className={typeof window !== 'undefined' && localStorage.getItem(`like_${id}`) ? "fill-rose-500" : ""} />
                     <span className="text-[10px] font-black">{Number(text.totalLikes || text.likes || 0)}</span>
                  </button>
                </>
              )}
              <button 
                onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success("Lien copié");}} 
                className="p-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl shadow-lg shadow-slate-200 active:scale-95 transition-all"
              >
                <Share2 size={20} />
              </button>
          </div>
        </header>

        <article className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {(text.isConcours === true || text.isConcours === "true") && <BadgeConcours />}
          <h1 className="text-5xl sm:text-8xl font-black italic tracking-tighter mb-6 leading-[0.9] text-slate-900 dark:text-slate-50">
            {text.title}
          </h1>
          <p className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em] mb-16 flex items-center gap-3">
              <span className="w-10 h-[2px] bg-teal-600"></span> 
              {text.isConcours ? `Candidat : ${text.concurrentId || 'Poète'}` : `Par ${text.authorName || 'Anonyme'}`}
          </p>
          
          <div className="prose-xl font-serif text-slate-800 dark:text-slate-300 leading-relaxed mb-24 whitespace-pre-wrap select-none sm:select-text text-justify tracking-tight">
            {text.content}
          </div>

          <button 
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all text-[9px] font-black uppercase tracking-[0.2em] mt-10 group"
          >
            <AlertTriangle size={14} className="group-hover:animate-bounce" />
            Signaler un problème avec ce texte
          </button>
        </article>

        <div className="my-12">
          <InTextAd />
        </div>

        {!isStaffText && (
          <SceauCertification 
            wordCount={text.content?.length || 100} 
            fileName={id} 
            userEmail={user?.email} 
            onValidated={() => fetchData(id, true)} 
            certifiedCount={text.totalCertified || 0}
          />
        )}

        <CommentSection 
          textId={id} 
          comments={text.comments || []} 
          user={user} 
          onCommented={() => fetchData(id, true)} 
        />

        <footer className="mt-20 text-center opacity-20">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] dark:text-slate-100">Lisible.biz • Expérience de lecture certifiée</p>
        </footer>

        <ReportModal 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)}
          textId={id}
          textTitle={text.title}
          userEmail={user?.email}
        />
      </div>
    </div>
  );
}
