"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { 
  Loader2, Send, ArrowUpRight, FileText, UserCircle, 
  Download, Award, Instagram, Twitter, Facebook, 
  MessageCircle, Maximize2, Minimize2, Wallet, 
  TrendingUp, ShieldCheck
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

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  // SYSTÈME DE RANG DES MEILLEURES PLUMES
  const getRank = (sc = 0) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-500", bg: "bg-purple-500/10", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-400", bg: "bg-slate-500/10", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-500", bg: "bg-orange-500/10", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-500", bg: "bg-slate-500/10", icon: "🖋️" };
  };

  const fetchLatestData = useCallback(async (email) => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: JSON.parse(localStorage.getItem("lisible_user")).password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("lisible_user", JSON.stringify(data.user));
      }
    } catch (e) { console.error(e); }
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
      toast.success("Badge certifié 1024px téléchargé !");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareOnSocial = (platform) => {
    const text = encodeURIComponent(`J'ai mon compte officiel sur Lisible ! Visitez-moi. ✨`);
    const url = encodeURIComponent("https://lisible.biz");
    const links = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`,
      instagram: `https://www.instagram.com/`
    };
    window.open(links[platform], "_blank");
  };

  const handleTransfer = async () => {
    if (transfer.amount < 1000) return toast.error("Le minimum est de 1000 Li");
    const tid = toast.loading("Transfert en cours...");
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, targetEmail: transfer.email, amount: transfer.amount, type: "transfer" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Transfert effectué !", { id: tid });
        fetchLatestData(user.email);
      } else { toast.error(data.error, { id: tid }); }
    } catch (e) { toast.error("Erreur de connexion", { id: tid }); }
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
  const rank = getRank(user?.wallet?.balance || 0);

  return (
    <div className={`min-h-screen selection:bg-teal-100 font-sans transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED] dark:bg-slate-950' : 'bg-[#FCFBF9] dark:bg-slate-950'}`}>
      <Head>
        <title>Tableau de bord | Lisible</title>
      </Head>

      <div className="fixed top-0 left-0 w-full h-1 z-[100] bg-teal-600 transition-all duration-200" style={{ width: `${scrollProgress}%` }} />

      <button onClick={() => setIsFocusMode(!isFocusMode)} className="fixed bottom-8 right-8 z-[90] p-4 bg-slate-900 text-white rounded-full shadow-2xl transition-transform hover:scale-110">
        {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20">
        
        <header className={`mb-16 transition-all duration-700 ${isFocusMode ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-16 h-16 rounded-3xl ${isStaff ? 'bg-slate-900' : 'bg-teal-600'} flex items-center justify-center text-white shadow-xl text-2xl`}>
              {rank.icon}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${rank.color}`}>{rank.name}</p>
              <h1 className="text-3xl font-serif font-black italic">{user?.penName}</h1>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Solde Actuel</p>
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

        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className={`grid grid-cols-2 gap-4 transition-all duration-700 ${isFocusMode ? 'opacity-0' : ''}`}>
            <button onClick={() => router.push("/publish")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-teal-500 transition-all group">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 w-fit rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Nouvelle Œuvre</span>
            </button>
            <button onClick={() => router.push("/account")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-slate-900 dark:hover:border-white transition-all group">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 w-fit rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                <Wallet size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Mon Compte</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Send size={14} className="text-teal-600" /> Transfert de fonds
            </h3>
            <div className="space-y-3">
              <input type="email" placeholder="Email du destinataire" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none text-sm focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, email: e.target.value})}/>
              <input type="number" placeholder="Montant (Li)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none text-sm focus:ring-2 ring-teal-500 outline-none" onChange={(e) => setTransfer({...transfer, amount: e.target.value})}/>
              <button onClick={handleTransfer} className="w-full bg-slate-900 dark:bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Confirmer l'envoi</button>
            </div>
          </div>

          {/* MODULE DE PROGRESSION DES RANGS */}
          {!isStaff && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Progression vers le retrait</p>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-1000" style={{ width: `${Math.min((user?.wallet?.balance / 25000) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[9px] font-black uppercase text-slate-500">Objectif : 25 000 Li</span>
                <span className="text-[9px] font-black uppercase text-teal-600">{Math.floor(Math.min((user?.wallet?.balance / 25000) * 100, 100))}%</span>
              </div>
            </div>
          )}

          <div className={`flex flex-col items-center text-center p-8 transition-all duration-700 ${isFocusMode ? 'opacity-0' : ''}`}>
            {/* BADGE SVG OFFICIEL (INECHANGÉ) */}
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

            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl mb-6">
              <Award size={18} className="text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Badge Certifié</span>
            </div>

            <div className="flex gap-3 mb-8">
               <button onClick={() => shareOnSocial('whatsapp')} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-emerald-500 transition-colors"><MessageCircle size={20} /></button>
               <button onClick={() => shareOnSocial('twitter')} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-sky-500 transition-colors"><Twitter size={20} /></button>
               <button onClick={() => shareOnSocial('facebook')} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-blue-600 transition-colors"><Facebook size={20} /></button>
            </div>

            <button onClick={handleDownloadBadge} className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-teal-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-teal-600 transition-all">
              <Download size={16} /> Télécharger
            </button>
          </div>
        </section>

        <footer className={`mt-24 border-t border-slate-100 dark:border-slate-900 pt-8 flex items-center justify-between transition-all duration-700 ${isFocusMode ? 'opacity-0' : ''}`}>
           <div className="flex items-center gap-2 text-slate-300 text-[9px] font-black uppercase tracking-widest">
             <ShieldCheck size={14} /> Sécurisé
           </div>
           <p className="text-[9px] font-black text-slate-400 uppercase italic">v2.1 Rank System</p>
        </footer>
      </div>
    </div>
  );
}
