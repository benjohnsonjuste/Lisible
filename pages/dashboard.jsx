"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Coins, ShieldCheck, Send, LogOut, TrendingUp, 
  ArrowUpRight, FileText, UserCircle, Download, Award, 
  Instagram, Twitter, Facebook, MessageCircle 
} from "lucide-react"; // Corrigé ici
import { toast } from "sonner";
import { formatLi } from "@/lib/utils";

export default function AuthorDashboard() {
  const router = useRouter();
  const badgeRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

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
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      const u = JSON.parse(logged);
      setUser(u);
      fetchLatestData(u.email);
    } else { router.push("/login"); }
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
    toast.info(`Redirection vers ${platform}...`);
  };

  const handleTransfer = async () => {
    if (transfer.amount < 1000) return toast.error("Le minimum est de 1000 Li");
    const tid = toast.loading("Transfert en cours...");
    
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          targetEmail: transfer.email,
          amount: transfer.amount,
          type: "transfer"
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Transfert effectué !", { id: tid });
        fetchLatestData(user.email);
      } else { toast.error(data.error, { id: tid }); }
    } catch (e) { toast.error("Erreur de connexion", { id: tid }); }
  };

  const getFormattedName = () => {
    const name = user?.penName || "Plume";
    if (name.length > 15 && name.includes(" ")) {
      const parts = name.split(" ");
      const mid = Math.ceil(parts.length / 2);
      return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
    }
    return [name, ""];
  };

  const [line1, line2] = getFormattedName();

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" /></div>;

  const isStaff = ADMIN_EMAILS.includes(user?.email?.toLowerCase().trim());

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER SOLDE */}
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">{user?.penName}</h1>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mt-2">Compte Officiel Lisible</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black text-amber-400 tracking-tighter">{formatLi(user?.wallet?.balance)} <span className="text-sm">Li</span></p>
          <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Disponible immédiatement</p>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => router.push("/publish")}
          className="group flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <FileText size={20} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Publier une œuvre</span>
          </div>
          <ArrowUpRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
        </button>

        <button 
          onClick={() => router.push("/account")}
          className="group flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-slate-900 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <UserCircle size={20} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Gérer mon profil</span>
          </div>
          <ArrowUpRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
        </button>
      </div>

      <div className={`grid grid-cols-1 ${isStaff ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8`}>
        {/* MODULE TRANSFERT */}
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Send size={18}/> Envoyer des Li</h3>
          <div className="space-y-4">
            <input 
              type="email" placeholder="Email" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500 text-sm"
              onChange={(e) => setTransfer({...transfer, email: e.target.value})}
            />
            <input 
              type="number" placeholder="Montant" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500 text-sm"
              onChange={(e) => setTransfer({...transfer, amount: e.target.value})}
            />
            <button onClick={handleTransfer} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all text-[10px]">
              Confirmer
            </button>
          </div>
        </div>

        {/* STATS RAPIDES - Masquées pour le staff */}
        {!isStaff && (
          <div className="bg-teal-50 p-8 rounded-[3rem] border border-teal-100 flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <TrendingUp className="text-teal-600" size={30} />
                <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full text-teal-600 uppercase">Valeur : ${(user?.wallet?.balance * 0.0002).toFixed(2)}</span>
             </div>
             <div>
                <p className="text-3xl font-black italic text-slate-900">Vers le retrait</p>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-teal-500 h-full" style={{ width: `${Math.min((user?.wallet?.balance / 25000) * 100, 100)}%` }}></div>
                </div>
                <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Objectif : 25 000 Li</p>
             </div>
          </div>
        )}

        {/* BADGE DE BIENVENUE & PARTAGE */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
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
              
              {line2 ? (
                <>
                  <text x="512" y="520" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{line1}</text>
                  <text x="512" y="620" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{line2}</text>
                </>
              ) : (
                <text x="512" y="550" fontFamily="serif" fontSize="100" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{line1}</text>
              )}
              
              <text x="512" y="750" fontFamily="sans-serif" fontSize="35" fontWeight="bold" fill="#fbbf24" textAnchor="middle" style={{letterSpacing: '6px'}}>lisible.biz</text>
              <circle cx="512" cy="850" r="40" fill="#14b8a6" />
              <text x="512" y="865" fontFamily="sans-serif" fontSize="40" fill="white" textAnchor="middle">✓</text>
            </svg>
          </div>
          
          <div className="relative p-5 bg-slate-900 rounded-3xl text-teal-400">
            <Award size={40} />
          </div>

          <div className="space-y-1">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Badge Lisible</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase italic">Compte Officiel</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
               <button onClick={() => shareOnSocial('whatsapp')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                  <MessageCircle size={16} />
               </button>
               <button onClick={() => shareOnSocial('facebook')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                  <Facebook size={16} />
               </button>
               <button onClick={() => shareOnSocial('instagram')} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                  <Instagram size={16} />
               </button>
               <button onClick={() => shareOnSocial('twitter')} className="p-2 bg-slate-50 text-slate-900 rounded-lg hover:bg-slate-900 hover:text-white transition-all">
                  <Twitter size={16} />
               </button>
            </div>
          </div>

          <button 
            onClick={handleDownloadBadge}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg"
          >
            <Download size={14} /> Télécharger
          </button>
        </div>
      </div>
    </div>
  );
}
