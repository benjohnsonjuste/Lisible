// app/dashboard/page.jsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, FileText, UserCircle, 
  Download, Bell, Users, Share2, 
  Maximize2, Minimize2, Wallet, 
  ShieldCheck, Sparkles,
  Radio, Globe
} from "lucide-react";
import { toast } from "sonner";

const formatLi = (val) => Number(val || 0).toLocaleString();

export default function AuthorDashboard() {
  const router = useRouter();
  const badgeRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");

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
      const res = await fetch(`/api/user-stats?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        const stored = JSON.parse(localStorage.getItem("lisible_user") || "{}");
        localStorage.setItem("lisible_user", JSON.stringify({ ...stored, ...data }));
      }
    } catch (e) { 
      console.error("Sync Error:", e); 
    } finally {
      setLoading(false);
    }
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
      fetchLatestData(u.email);
    } else { 
      router.push("/login"); 
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, [router, fetchLatestData]);

  const handleStartLive = async () => {
    if (!liveTitle.trim()) return toast.error("Donnez un titre à votre salon");
    setIsLiveLoading(true);
    const tid = toast.loading("Initialisation du flux direct...");
    
    try {
      const res = await fetch("/api/live/create-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email, 
          title: liveTitle,
          penName: user.penName 
        })
      });

      if (res.ok) {
        toast.success("En direct !", { id: tid });
        router.push(`/live/${Buffer.from(user.email).toString('base64').replace(/=/g, "")}`);
      } else {
        toast.error("Échec de la création du salon", { id: tid });
      }
    } catch (e) {
      toast.error("Erreur de connexion au serveur Live", { id: tid });
    } finally {
      setIsLiveLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (transfer.amount < 1000) return toast.error("Le minimum est de 1000 Li");
    const tid = toast.loading("Sécurisation du transfert...");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email, 
          targetEmail: transfer.email, 
          amount: Number(transfer.amount), 
          type: "transfer" 
        })
      });

      if (res.ok) {
        toast.success("Li envoyés avec succès !", { id: tid });
        fetchLatestData(user.email);
      } else { 
        const err = await res.json();
        toast.error(err.error || "Erreur de transfert", { id: tid }); 
      }
    } catch (e) { 
      toast.error("Serveur indisponible", { id: tid }); 
    }
  };

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

  if (loading || !user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9] dark:bg-slate-950 gap-4">
      <Loader2 className="animate-spin text-teal-600" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronisation du compte...</p>
    </div>
  );

  const isStaff = ADMIN_EMAILS.includes(user?.email?.toLowerCase().trim());

  // Logique de découpage du nom pour le badge
  const name = user.penName || user.name || "";
  const words = name.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach(word => {
    if ((currentLine + word).length > 12) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });
  lines.push(currentLine.trim());
  const finalLines = lines.slice(0, 3); // Max 3 lignes

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isFocusMode ? 'bg-[#F9F7F2] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
      
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-teal-600/20">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <button onClick={() => setIsFocusMode(!isFocusMode)} className="fixed bottom-8 right-8 z-[110] p-4 bg-slate-900 text-white dark:bg-teal-600 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90">
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
        
        <header className={`mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-20 blur-sm scale-95' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-[1.5rem] ${isStaff ? 'bg-slate-900 shadow-slate-900/20' : 'bg-teal-600 shadow-teal-600/20'} flex items-center justify-center text-white shadow-2xl rotate-3`}>
                <span className="text-2xl italic font-serif font-black">{(user.penName || user.name).charAt(0)}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-1">
                  <ShieldCheck size={12} /> Compte Officiel
                </p>
                <h1 className="text-3xl font-serif font-black italic dark:text-white">{user?.penName || user.name}</h1>
              </div>
            </div>
            <button onClick={() => router.push("/notifications")} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative shadow-sm hover:bg-slate-50 transition-colors">
              <Bell size={20} className="text-slate-400" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lectures</p>
              <p className="text-lg font-serif font-bold dark:text-white">{user.stats?.totalViews || 0}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Abonnés</p>
              <p className="text-lg font-serif font-bold dark:text-white">{user.stats?.subscribersList?.length || 0}</p>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Valeur Li</p>
              <p className="text-lg font-serif font-bold text-teal-600">{(Number(user?.wallet?.balance || 0) * 0.0002).toFixed(2)}$</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Solde Actuel</p>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-serif font-black italic text-slate-900 dark:text-white">{formatLi(user?.wallet?.balance)}</span>
              <span className="text-teal-600 font-black text-sm uppercase">Li</span>
            </div>
          </div>
        </header>

        <section className="space-y-12">
          
          <div className={`bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-900 p-8 rounded-[3rem] border border-rose-100 dark:border-rose-900/30 shadow-xl transition-all duration-700 ${isFocusMode ? 'opacity-0 scale-95' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-rose-600">
                <Radio size={16} className="animate-pulse" /> Lisible Direct
              </h3>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-rose-100">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                <span className="text-[9px] font-black text-rose-600 uppercase italic">Salon Auteur</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="Sujet de votre direct..." 
                  className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl border-none text-sm focus:ring-2 ring-rose-500 outline-none shadow-inner"
                />
                <Globe className="absolute right-5 top-5 text-slate-200" size={18} />
              </div>
              
              <button 
                onClick={handleStartLive}
                disabled={isLiveLoading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isLiveLoading ? <Loader2 className="animate-spin" size={18} /> : <><Radio size={18} /> Lancer le Direct</>}
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${isFocusMode ? 'opacity-0 translate-y-10' : ''}`}>
            <button onClick={() => router.push("/publier")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:border-teal-500 transition-all group">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 w-fit rounded-2xl group-hover:scale-110 transition-all">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300 text-left">Nouvelle Œuvre</span>
            </button>
            <button onClick={() => router.push("/communaute")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] hover:border-slate-900 transition-all group">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 w-fit rounded-2xl group-hover:scale-110 transition-all">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300 text-left">Communauté</span>
            </button>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-teal-400">
              <Wallet size={14} /> Transfert Li Express
            </h3>
            <div className="space-y-4 relative z-10">
              <input type="email" placeholder="Email destinataire" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, email: e.target.value})}/>
              <input type="number" placeholder="Montant" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, amount: Number(e.target.value)})}/>
              <button onClick={handleTransfer} className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors active:scale-95">Confirmer l'envoi</button>
            </div>
          </div>

          <div className="hidden">
            <svg ref={badgeRef} width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <rect width="1024" height="1024" fill="#0f172a"/>
              <rect x="50" y="50" width="924" height="924" fill="none" stroke="#14b8a6" strokeWidth="15"/>
              <text x="512" y="300" fontFamily="sans-serif" fontSize="30" fontWeight="900" fill="#14b8a6" textAnchor="middle" style={{letterSpacing: '20px'}}>COMPTE OFFICIEL</text>
              
              <g transform="translate(512, 500)">
                {finalLines.map((line, i) => (
                  <text
                    key={i}
                    y={i * 110 - ((finalLines.length - 1) * 55)}
                    fontFamily="serif"
                    fontSize="100"
                    fontWeight="900"
                    fontStyle="italic"
                    fill="white"
                    textAnchor="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>

              <circle cx="512" cy="850" r="40" fill="#14b8a6" />
              <text x="512" y="865" fontFamily="sans-serif" fontSize="40" fill="white" textAnchor="middle">✓</text>
            </svg>
          </div>

          <div className={`flex flex-col items-center gap-6 transition-all duration-700 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex gap-4">
               <button onClick={() => {navigator.clipboard.writeText("https://lisible.biz"); toast.success("Lien copié !");}} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-90 transition-transform"><Share2 size={20} /></button>
               <button onClick={handleDownloadBadge} className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95">
                 <Download size={16} /> Télécharger mon badge
               </button>
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <ShieldCheck size={14} className="text-teal-600" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compte Officiel• 2026</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
