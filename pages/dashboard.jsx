"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { 
  Loader2, Send, ArrowUpRight, FileText, UserCircle, 
  Download, Award, Twitter, Facebook, 
  MessageCircle, Maximize2, Minimize2, Wallet, 
  TrendingUp, ShieldCheck, Sparkles, Share2,
  Bell, Users, BarChart3, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { formatLi } from "@/lib/utils";

export default function AuthorDashboard() {
  const router = useRouter();
  const badgeRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [metrics, setMetrics] = useState({ followers: 0, views: 0 });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const fetchLatestData = useCallback(async (email) => {
    try {
      const stored = localStorage.getItem("lisible_user");
      if (!stored) return;
      const userData = JSON.parse(stored);
      
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: userData.password })
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("lisible_user", JSON.stringify(data.user));

        const [mRes, fRes] = await Promise.all([
          fetch(`/api/author/${data.user.id}/metrics`),
          fetch(`/api/get-followers-count?userId=${data.user.id}`)
        ]);
        
        if (mRes.ok && fRes.ok) {
          const mData = await mRes.json();
          const fData = await fRes.json();
          setMetrics({ views: mData.totalViews || 0, followers: fData.count || 0 });
        }
      }
    } catch (e) { console.error("Erreur sync:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      const u = JSON.parse(logged);
      setUser(u);
      fetchLatestData(u.email);
    } else { router.push("/login"); }
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [router, fetchLatestData]);

  const handleDownloadBadge = () => {
    const svg = badgeRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Lisible_Badge_${user?.penName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("Badge certifié téléchargé !");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleUniversalShare = async () => {
    // Construction du lien vers pages/auteur/[email].js
    const authorEmail = user?.email?.toLowerCase().trim() || "";
    const shareData = {
      title: "Lisible - Catalogue d'Auteur",
      text: `Découvrez le catalogue d'œuvres de ${user?.penName} sur Lisible !`,
      url: `https://lisible.biz/auteur/${authorEmail}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Lien du catalogue copié !");
      }
    } catch (err) {
      console.log("Erreur de partage");
    }
  };

  const handleTransfer = async () => {
    if (transfer.amount < 1000) return toast.error("Le minimum est de 1000 Li");
    const tid = toast.loading("Sécurisation...");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, targetEmail: transfer.email, amount: transfer.amount, type: "transfer" })
      });
      if (res.ok) {
        toast.success("Li envoyés !", { id: tid });
        fetchLatestData(user.email);
      } else { toast.error("Erreur de transfert", { id: tid }); }
    } catch (e) { toast.error("Serveur indisponible", { id: tid }); }
  };

  const nameParts = useMemo(() => {
    const name = user?.penName || "Plume";
    if (name.length > 15 && name.includes(" ")) {
      const parts = name.split(" ");
      const mid = Math.ceil(parts.length / 2);
      return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
    }
    return [name, ""];
  }, [user?.penName]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9] dark:bg-slate-950"><Loader2 className="animate-spin text-teal-600" /></div>;

  const isStaff = ADMIN_EMAILS.includes(user?.email?.toLowerCase().trim());

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-all duration-1000 ${isFocusMode ? 'bg-[#F9F7F2] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
      <Head><title>Tableau de bord | {user.penName}</title></Head>

      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-teal-600/20">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <button onClick={() => setIsFocusMode(!isFocusMode)} className="fixed bottom-8 right-8 z-[110] p-4 bg-slate-900 text-white dark:bg-teal-600 rounded-full shadow-2xl transition-all hover:scale-110">
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
        
        <header className={`mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-20 blur-sm scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-[1.5rem] ${isStaff ? 'bg-slate-900' : 'bg-teal-600'} flex items-center justify-center text-white shadow-xl text-2xl rotate-3`}>
                {isStaff ? <ShieldCheck /> : <Sparkles />}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? 'text-slate-500' : 'text-teal-600'}`}>{isStaff ? 'Administration' : 'Auteur Certifié'}</p>
                <h1 className="text-3xl font-serif font-black italic dark:text-white">{user?.penName}</h1>
              </div>
            </div>
            <button onClick={() => router.push("/notifications")} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
              <Bell size={20} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>

          {!isStaff && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lectures</p>
                <p className="text-lg font-serif font-bold dark:text-white">{metrics.views}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Abonnés</p>
                <p className="text-lg font-serif font-bold dark:text-white">{metrics.followers}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Solde de Plume</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-serif font-black italic text-slate-900 dark:text-white">{formatLi(user?.wallet?.balance)}</span>
                <span className="text-teal-600 font-black text-xs uppercase">Li</span>
              </div>
            </div>
            {!isStaff && (
               <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-teal-600 mb-1 flex items-center gap-1 justify-end"><TrendingUp size={12}/> Valeur</p>
                 <p className="font-bold text-slate-900 dark:text-slate-300">{(user?.wallet?.balance * 0.0002).toFixed(2)} USD</p>
               </div>
            )}
          </div>
        </header>

        <section className="space-y-12">
          
          <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${isFocusMode ? 'opacity-0 translate-y-10' : ''}`}>
            <button onClick={() => router.push("/publish")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-teal-500 transition-all group shadow-sm">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 w-fit rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">Nouvelle Œuvre</span>
            </button>
            <button onClick={() => router.push("/communaute")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-slate-900 dark:hover:border-white transition-all group shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 w-fit rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">Communauté</span>
            </button>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Send size={80} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-teal-400">
              <Wallet size={14} /> Transfert de jetons Li
            </h3>
            <div className="space-y-4 relative z-10">
              <input type="email" placeholder="Email destinataire" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, email: e.target.value})}/>
              <input type="number" placeholder="Montant" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, amount: e.target.value})}/>
              <button onClick={handleTransfer} className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors">Envoyer les Li</button>
            </div>
          </div>

          {!isStaff && (
            <div className={`bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 transition-all duration-700 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex justify-between items-end mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objectif Retrait</p>
                <p className="text-[10px] font-black text-teal-600">25 000 Li</p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-1000" style={{ width: `${Math.min((user?.wallet?.balance / 25000) * 100, 100)}%` }}></div>
              </div>
              <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase text-center">{Math.floor((user?.wallet?.balance / 25000) * 100)}% complété</p>
            </div>
          )}

          <div className={`flex flex-col items-center text-center p-8 transition-all duration-700 ${isFocusMode ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
            <div className="hidden">
              <svg ref={badgeRef} width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#0f172a', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#1e293b', stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <rect width="1024" height="1024" fill="url(#grad)"/>
                <rect x="50" y="50" width="924" height="924" fill="none" stroke="#14b8a6" strokeWidth="15"/>
                <text x="512" y="380" fontFamily="sans-serif" fontSize="30" fontWeight="900" fill="#14b8a6" textAnchor="middle" style={{letterSpacing: '20px'}}>COMPTE OFFICIEL</text>
                {nameParts[1] ? (
                  <>
                    <text x="512" y="520" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[0]}</text>
                    <text x="512" y="620" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[1]}</text>
                  </>
                ) : (
                  <text x="512" y="550" fontFamily="serif" fontSize="100" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[0]}</text>
                )}
                <text x="512" y="750" fontFamily="sans-serif" fontSize="35" fontWeight="bold" fill="#fbbf24" textAnchor="middle" style={{letterSpacing: '6px'}}>lisible.biz</text>
                <circle cx="512" cy="850" r="40" fill="#14b8a6" />
                <text x="512" y="865" fontFamily="sans-serif" fontSize="40" fill="white" textAnchor="middle">✓</text>
              </svg>
            </div>

            <div className="mb-6">
               <CheckCircle2 size={48} className="text-teal-600 animate-pulse" />
            </div>

            <div className="flex gap-4">
               <button onClick={handleUniversalShare} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-teal-600 transition-colors shadow-sm"><Share2 size={20} /></button>
               <button onClick={handleDownloadBadge} className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                 <Download size={16} /> Télécharger
               </button>
            </div>
          </div>
        </section>

        <footer className={`mt-24 border-t border-slate-100 dark:border-slate-900 pt-8 flex items-center justify-between transition-all duration-700 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
           <div className="flex items-center gap-2 text-slate-300 text-[9px] font-black uppercase tracking-widest">
             <ShieldCheck size={14} /> Compte sécurisé
           </div>
           <p className="text-[9px] font-black text-slate-400 uppercase italic">v3.0.5 Deployment Stable</p>
        </footer>
      </div>
    </div>
  );
}
