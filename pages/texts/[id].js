"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Loader2, Share2, Eye, Heart, Trophy, 
  ShieldCheck, Sparkles, Send, MessageCircle, AlertTriangle, Download
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
function SceauCertification({ wordCount, fileName, userEmail, onValidated, certifiedCount, authorName, textTitle }) {
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

  const generateCertificate = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0d9488', '#1e293b', '#ffffff']
    });

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFillColor(253, 251, 247); doc.rect(0, 0, 297, 210, "F");
    doc.setLineWidth(2); doc.setDrawColor(13, 148, 136); doc.rect(10, 10, 277, 190);
    doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFontSize(40);
    doc.text("CERTIFICAT DE PUBLICATION", 148.5, 60, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(16);
    doc.text("La plateforme LISIBLE certifie que l'œuvre intitulée", 148.5, 85, { align: "center" });
    doc.setFont("times", "italic"); doc.setFontSize(28);
    doc.text(`"${textTitle}"`, 148.5, 105, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(16);
    doc.text("a été officiellement publiée et reconnue avec", 148.5, 125, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`${certifiedCount} CERTIFICATIONS DE LECTURE`, 148.5, 140, { align: "center" });
    doc.setFontSize(14); doc.text(`Auteur : ${authorName || "Anonyme"}`, 148.5, 160, { align: "center" });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Délivré le ${new Date().toLocaleDateString()} par Lisible.biz`, 148.5, 185, { align: "center" });
    doc.save(`Certificat_Lisible_${textTitle}.pdf`);
    toast.success("Félicitations pour votre plume !");
  };

  const validate = async () => {
    if (seconds > 0) return toast.info(`Attendez ${seconds}s pour certifier votre lecture.`);
    if (isValidated || isProcessing) return;
    setIsProcessing(true);
    const t = toast.loading("Protocole de scellage...");
    try {
      const res = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textId: fileName, readerEmail: userEmail || "anonymous@lisible.biz", authorEmail: "" })
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
      <div className="flex flex-col items-center gap-4">
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center gap-3">
          <Sparkles size={14} className="text-teal-500" />
          <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">
             {Number(certifiedCount) || 0} CERTIFICATIONS
          </span>
        </div>
        {Number(certifiedCount) >= 10 && (
          <button 
            onClick={generateCertificate}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 transition-all shadow-xl animate-in fade-in zoom-in"
          >
            <Download size={14} /> Télécharger le Certificat
          </button>
        )}
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
      if (res.ok) { setMsg(""); onCommented(); toast.success("Message publié"); }
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
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Écrire une réponse..." disabled={!user || sending} className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none text-slate-900 dark:text-slate-100" />
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
  const [liveViews, setLiveViews] = useState(0); 
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

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
    } catch (e) { console.error("Erreur de rafraîchissement", e); }
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
        const data = await res.json();
        setLiveLikes(data.count);
        localStorage.setItem(likeKey, "true");
        toast.success("Aimé !");
      }
    } catch (e) { toast.error("Action impossible."); }
    finally { setIsLiking(false); }
  };

  useEffect(() => {
    if (router.isReady && id) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));
      fetchData(id).then(loaded => {
        if (!loaded && !text) return;
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
              setLiveViews(data.views);
              setLiveLikes(data.likes || 0);
            }
          });
        }
      });
    }
  }, [router.isReady, id, fetchData]);

  if (!text) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4 bg-[#FCFBF9] dark:bg-slate-950">
      <Loader2 className="animate-spin text-teal-600" size={30} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ouverture du manuscrit...</p>
    </div>
  );

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());
  const seoDescription = text.content ? text.content.replace(/<[^>]*>/g, '').substring(0, 155).trim() + "..." : "Découvrez ce manuscrit certifié sur Lisible.";

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#FCFBF9] dark:bg-slate-950 selection:bg-teal-100">
      <Head>
        <title>{`${text.title} | par ${text.authorName || 'Anonyme'} | Lisible`}</title>
        <meta name="description" content={seoDescription} />
        <meta name="author" content={text.authorName || 'Anonyme'} />
        <link rel="canonical" href={`https://lisible.biz/texte/${id}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://lisible.biz/texte/${id}`} />
        <meta property="og:title" content={`${text.title} — Par ${text.authorName || 'Anonyme'}`} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={text.coverImage || "https://lisible.biz/og-card.png"} />
        <meta property="og:site_name" content="Lisible" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={text.title} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={text.coverImage || "https://lisible.biz/og-card.png"} />
      </Head>

      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20 pb-32 overflow-x-hidden">
        <header className="flex justify-between items-center mb-16 sm:mb-24">
          <button onClick={() => router.back()} className="p-3 bg-white dark:bg-slate-900 rounded-2xl hover:shadow-md transition-all border border-slate-100 dark:border-slate-800">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex gap-2">
              {!isStaffText && (
                <>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">
                     <Eye size={14} /> 
                     <span className="text-[10px] font-black">{liveViews || Number(text.views) || 0}</span>
                  </div>
                  <button onClick={handleLike} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-90 shadow-sm ${typeof window !== 'undefined' && localStorage.getItem(`like_${id}`) ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                     <Heart size={14} className={typeof window !== 'undefined' && localStorage.getItem(`like_${id}`) ? "fill-rose-500" : ""} />
                     <span className="text-[10px] font-black">{liveLikes || Number(text.totalLikes || text.likes || 0)}</span>
                  </button>
                </>
              )}
              <button onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success("Lien copié");}} className="p-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl shadow-xl active:scale-95 transition-all">
                <Share2 size={20} />
              </button>
          </div>
        </header>

        <article className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {(text.isConcours === true || text.isConcours === "true") && <BadgeConcours />}
          <h1 className="text-5xl sm:text-7xl font-serif font-black italic tracking-tight mb-10 leading-[1.1] text-slate-900 dark:text-slate-50">
            {text.title}
          </h1>
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xl border border-teal-200 dark:border-teal-800">
              {text.authorName ? text.authorName[0].toUpperCase() : 'P'}
            </div>
            <div>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">
                {text.isConcours ? `Candidat Officiel` : `Plume certifiée`}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {text.authorName || 'Anonyme'}
              </p>
            </div>
          </div>
          
          <div className="
            prose prose-slate dark:prose-invert max-w-none font-serif 
            text-[1.2rem] sm:text-[1.35rem] leading-[1.8] text-slate-800 dark:text-slate-200 
            whitespace-pre-wrap text-justify tracking-tight mb-24
            first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-teal-600
          ">
            {text.content}
          </div>

          <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all text-[9px] font-black uppercase tracking-[0.2em] group">
            <AlertTriangle size={14} className="group-hover:animate-bounce" />
            Signaler un problème
          </button>
        </article>

        <div className="my-12"><InTextAd /></div>

        {!isStaffText && (
          <SceauCertification wordCount={text.content?.length || 100} fileName={id} userEmail={user?.email} onValidated={() => fetchData(id, true)} certifiedCount={text.totalCertified || 0} authorName={text.authorName} textTitle={text.title} />
        )}

        <CommentSection textId={id} comments={text.comments || []} user={user} onCommented={() => fetchData(id, true)} />

        <footer className="mt-24 text-center opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] dark:text-slate-100">Lisible.biz • Expérience de lecture d'élite</p>
        </footer>

        <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} userEmail={user?.email} />
      </div>
    </div>
  );
}
