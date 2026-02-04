"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Loader2, Share2, Eye, Heart, Trophy, 
  ShieldCheck, Sparkles, Send, MessageCircle, AlertTriangle, Download,
  Maximize2, Minimize2, Clock
} from "lucide-react";

import { InTextAd } from "@/components/InTextAd";

const ReportModal = dynamic(() => import("@/components/ReportModal"), { ssr: false });

// --- COMPOSANTS INTERNES ---
function BadgeConcours() {
  return (
    <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-2xl shadow-lg mb-6 animate-in zoom-in">
      <Trophy size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">Candidat Officiel</span>
    </div>
  );
}

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

  const generateCertificate = async () => {
    const { default: confetti } = await import("canvas-confetti");
    const { default: jsPDF } = await import("jspdf");
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0d9488', '#1e293b', '#ffffff'] });
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
        body: JSON.stringify({ textId: fileName, readerEmail: userEmail || "anonymous@lisible.biz" })
      });
      if (res.ok) {
        localStorage.setItem(`cert_${fileName}`, "true");
        setIsValidated(true);
        toast.success("Sceau apposé !", { id: t });
        onValidated(); 
      }
    } catch (e) { toast.error("Échec de connexion."); }
    finally { setIsProcessing(false); }
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
        <div onClick={validate} className={`absolute inset-4 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 shadow-2xl ${isValidated ? 'bg-teal-500 shadow-teal-500/40' : 'bg-slate-900 shadow-rose-900/20 hover:scale-105 active:scale-95'}`}>
          {isValidated ? <ShieldCheck size={40} className="text-white animate-in zoom-in" /> : <div className="text-center text-white"><span className="block text-lg font-black italic tracking-tighter">LISIBLE</span><span className="block text-[9px] font-bold uppercase tracking-[0.2em]">{seconds > 0 ? `${seconds}S` : "SCELLER"}</span></div>}
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center gap-3">
          <Sparkles size={14} className="text-teal-500" />
          <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{Number(certifiedCount) || 0} CERTIFICATIONS</span>
        </div>
        {Number(certifiedCount) >= 10 && (
          <button onClick={generateCertificate} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 transition-all shadow-xl"><Download size={14} /> Télécharger le Certificat</button>
        )}
      </div>
    </div>
  );
}

function CommentSection({ textId, comments = [], user, onCommented }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const postComment = async () => {
    if (!user) return toast.error("Connectez-vous.");
    if (msg.trim().length < 2) return;
    setSending(true);
    try {
      const res = await fetch('/api/texts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: textId, action: "comment", payload: { userEmail: user.email, userName: user.penName || "Plume", text: msg.trim(), date: new Date().toISOString() } })
      });
      if (res.ok) { setMsg(""); onCommented(); toast.success("Publié"); }
    } catch (e) { toast.error("Erreur"); }
    finally { setSending(false); }
  };
  return (
    <div className="mt-20">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2"><MessageCircle size={16} /> Flux des Pensées</h3>
      <div className="space-y-4 mb-10">
        {comments.length === 0 ? <p className="text-xs text-slate-300 italic text-center py-4">Soyez le premier...</p> : comments.map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-teal-600 uppercase">{c.userName}</span><span className="text-[8px] text-slate-300 font-bold">{new Date(c.date).toLocaleDateString()}</span></div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="sticky bottom-6 flex gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Écrire..." disabled={!user || sending} className="flex-1 bg-transparent px-4 py-3 text-sm font-bold outline-none" />
        <button onClick={postComment} disabled={sending || !user} className="p-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl hover:bg-teal-600 transition-all">{sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}</button>
      </div>
    </div>
  );
}

// --- PAGE PRINCIPALE ---
export default function TextPage({ initialText, id: textId }) {
  const router = useRouter();
  const id = textId || router.query.id;
  
  const [text, setText] = useState(initialText);
  const [user, setUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [liveViews, setLiveViews] = useState(0); 
  const [liveLikes, setLiveLikes] = useState(0);
  const viewLogged = useRef(false);

  // ÉTATS PRESTIGE (Pilier 4)
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  const fetchData = useCallback(async (tid) => {
    if (!tid) return;
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${tid}.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        setText(content);
        return content;
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (id) {
      const stored = localStorage.getItem("lisible_user");
      if (stored) setUser(JSON.parse(stored));
      
      const viewKey = `view_${id}`;
      if (!localStorage.getItem(viewKey) && !viewLogged.current) {
        viewLogged.current = true;
        fetch('/api/track-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ textId: id }) })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem(viewKey, "true");
            setLiveViews(data.views);
            setLiveLikes(data.likes || 0);
          }
        });
      }
    }
  }, [id]);

  const readingTime = useMemo(() => {
    const words = text?.content?.split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  }, [text?.content]);

  if (router.isFallback || !text) return (
    <div className="max-w-2xl mx-auto px-6 py-20 animate-pulse bg-[#FCFBF9] dark:bg-slate-950 min-h-screen">
      <div className="h-12 w-12 bg-slate-200 rounded-2xl mb-20" />
      <div className="h-16 w-full bg-slate-200 rounded-3xl mb-6" />
      <div className="h-16 w-3/4 bg-slate-200 rounded-3xl mb-12" />
      <div className="flex items-center gap-4 mb-20">
        <div className="h-12 w-12 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
      </div>
    </div>
  );

  const isStaffText = ADMIN_EMAILS.includes(text.authorEmail?.toLowerCase().trim());
  const seoDescription = text.content ? text.content.replace(/<[^>]*>/g, '').substring(0, 155).trim() + "..." : "Lisible";

  return (
    <div className={`min-h-screen transition-colors duration-1000 selection:bg-teal-100 font-sans ${isFocusMode ? 'bg-[#F5F2ED] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
      <Head>
        <title>{`${text.title} | Lisible`}</title>
        <meta name="description" content={seoDescription} />
      </Head>

      {/* BARRE DE LECTURE (Pilier 4) */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-transparent">
        <div className="h-full bg-teal-600 transition-all duration-200 ease-out" style={{ width: `${readingProgress}%` }} />
      </div>

      {/* BOUTON FOCUS (Pilier 4) */}
      <button 
        onClick={() => setIsFocusMode(!isFocusMode)}
        className={`fixed bottom-8 right-8 z-[90] p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 ${isFocusMode ? 'bg-teal-600 text-white' : 'bg-slate-900 text-white'}`}
      >
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20 pb-32">
        <header className={`flex justify-between items-center mb-16 sm:mb-24 transition-all duration-700 ${isFocusMode ? 'opacity-0 -translate-y-10 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={() => router.back()} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><ArrowLeft size={20} /></button>
          <div className="flex gap-2">
            {!isStaffText && (
              <>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border text-[10px] font-black shadow-sm"><Eye size={14} /> {liveViews || text.views || 0}</div>
                <button onClick={async () => {
                  const lKey = `like_${id}`;
                  if (localStorage.getItem(lKey) || isLiking) return;
                  setIsLiking(true);
                  const res = await fetch('/api/texts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: "like" }) });
                  if (res.ok) { const d = await res.json(); setLiveLikes(d.count); localStorage.setItem(lKey, "true"); toast.success("Aimé !"); }
                  setIsLiking(false);
                }} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-900 text-[10px] font-black shadow-sm"><Heart size={14} /> {liveLikes || text.totalLikes || 0}</button>
              </>
            )}
            <button onClick={() => {navigator.clipboard.writeText(window.location.href); toast.success("Lien copié");}} className="p-3 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl shadow-xl"><Share2 size={20} /></button>
          </div>
        </header>

        <article className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className={`mb-10 flex items-center gap-4 transition-all duration-700 ${isFocusMode ? 'opacity-40' : 'opacity-100'}`}>
            {text.isConcours && <BadgeConcours />}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-lg">
              <Clock size={12} /> {readingTime} MIN
            </div>
          </div>

          <h1 className={`font-serif font-black italic tracking-tight leading-[1.1] transition-all duration-1000 ${isFocusMode ? 'text-6xl sm:text-8xl text-slate-950 dark:text-white mb-20' : 'text-5xl sm:text-7xl text-slate-900 dark:text-slate-50 mb-10'}`}>
            {text.title}
          </h1>

          <div className={`flex items-center gap-4 mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xl border border-teal-200 dark:border-teal-800">{text.authorName?.[0].toUpperCase()}</div>
            <div><p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">{text.isConcours ? "Candidat" : "Plume certifiée"}</p><p className="text-sm font-bold">{text.authorName || 'Anonyme'}</p></div>
          </div>
          
          <div className={`prose prose-slate dark:prose-invert max-w-none font-serif leading-[1.8] text-justify tracking-tight mb-24 transition-all duration-1000 first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-teal-600 ${isFocusMode ? 'text-2xl text-slate-900 dark:text-slate-100' : 'text-[1.2rem] sm:text-[1.35rem] text-slate-800 dark:text-slate-200 whitespace-pre-wrap'}`}>
            {text.content}
          </div>

          <button onClick={() => setIsReportOpen(true)} className={`flex items-center gap-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all text-[9px] font-black uppercase tracking-[0.2em] ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}><AlertTriangle size={14} /> Signaler</button>
        </article>

        <div className={`transition-all duration-700 ${isFocusMode ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100'}`}>
          <div className="my-12"><InTextAd /></div>
          {!isStaffText && <SceauCertification wordCount={text.content?.length} fileName={id} userEmail={user?.email} onValidated={() => fetchData(id)} certifiedCount={text.totalCertified} authorName={text.authorName} textTitle={text.title} />}
          <CommentSection textId={id} comments={text.comments} user={user} onCommented={() => fetchData(id)} />
          <footer className="mt-24 text-center opacity-30 text-[8px] font-black uppercase tracking-[0.5em]">Lisible.biz • Expérience d'élite</footer>
        </div>
        
        {isReportOpen && <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} textId={id} textTitle={text.title} userEmail={user?.email} />}
      </div>
    </div>
  );
}

export async function getStaticPaths() { return { paths: [], fallback: 'blocking' }; }

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${params.id}.json`);
    const data = await res.json();
    const initialText = JSON.parse(decodeURIComponent(escape(atob(data.content))));
    return { props: { initialText, id: params.id }, revalidate: 60 };
  } catch (e) { return { notFound: true }; }
}
