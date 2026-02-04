"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Send, TrendingUp, FileText, 
  Download, Award, MessageCircle, Facebook, Share2, Trash2, Edit3, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import * as htmlToImage from 'html-to-image';

export default function AuthorDashboard() {
  const router = useRouter();
  const badgeRef = useRef(null); // Référence pour la capture d'image
  const [user, setUser] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTexts, setLoadingTexts] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });

  const getRank = (sc = 0) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-400", bg: "bg-purple-500/10", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-300", bg: "bg-slate-500/10", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-400", bg: "bg-orange-500/10", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-500", bg: "bg-slate-500/10", icon: "🖋️" };
  };

  // FONCTION DE TÉLÉCHARGEMENT DU BADGE EN IMAGE
  const downloadBadgeImage = async () => {
    if (!badgeRef.current) return;
    const tid = toast.loading("Génération de l'image...");
    try {
      const dataUrl = await htmlToImage.toPng(badgeRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Badge-Officiel-${user?.penName || 'Lisible'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Badge téléchargé !", { id: tid });
    } catch (err) {
      toast.error("Erreur lors du téléchargement", { id: tid });
    }
  };

  const fetchMyTexts = useCallback(async (email) => {
    if (!email) return;
    setLoadingTexts(true);
    try {
      const res = await fetch(`/api/texts?authorEmail=${email.toLowerCase().trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTexts(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error("Erreur textes:", e); }
    finally { setLoadingTexts(false); }
  }, []);

  const fetchLatestData = useCallback(async (email, pass) => {
    try {
      const res = await fetch("/api/login", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ email, password: pass }) 
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("lisible_user", JSON.stringify(data.user));
        fetchMyTexts(data.user.email);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [fetchMyTexts]);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      try {
        const u = JSON.parse(logged);
        fetchLatestData(u.email, u.password);
      } catch (e) { router.push("/login"); }
    } else { router.push("/login"); }
  }, [router, fetchLatestData]);

  const handleDeleteText = async (id) => {
    if (!confirm("Supprimer définitivement ?")) return;
    const tid = toast.loading("Suppression...");
    try {
      const res = await fetch(`/api/texts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Retiré", { id: tid });
        setTexts(texts.filter(t => t.id !== id));
      }
    } catch (e) { toast.error("Échec"); }
  };

  const handleTransfer = async () => {
    const amount = Number(transfer.amount);
    if (!user?.wallet) return;
    if (amount < 1000) return toast.error("Minimum 1000 Li");
    if (user.wallet.balance < amount) return toast.error("Solde insuffisant");
    const tid = toast.loading("Transfert...");
    try {
      const res = await fetch("/api/wallet", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ email: user.email, targetEmail: transfer.email, amount, type: "transfer" }) 
      });
      if (res.ok) { 
        toast.success(`Réussi !`, { id: tid }); 
        fetchLatestData(user.email, user.password); 
      }
    } catch (e) { toast.error("Erreur"); }
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FCFBF9] gap-4">
        <Loader2 className="animate-spin text-teal-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initialisation du Dashboard...</p>
      </div>
    );
  }

  const rank = getRank(user?.wallet?.balance);
  const balance = user?.wallet?.balance || 0;
  const progressPercent = Math.min((balance / 25000) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 pb-20 font-sans animate-in fade-in duration-1000">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl gap-8 border border-white/5">
        <div className="text-center md:text-left">
          <div className={`inline-flex items-center gap-2 ${rank.color} ${rank.bg} px-4 py-2 rounded-2xl mb-4 border border-white/10`}>
             <span className="text-xl">{rank.icon}</span>
             <span className="text-[10px] font-black uppercase tracking-widest">{rank.name}</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-none">{user?.penName}</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-500 mt-2 italic">Auteur Certifié Lisible</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-right min-w-[200px]">
          <p className="text-5xl font-black text-amber-400 tracking-tighter">{balance} <span className="text-sm">Li</span></p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Solde Disponible</p>
        </div>
      </header>

      {/* MES ŒUVRES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
            <BookOpen size={16} /> Mes Œuvres ({texts.length})
          </h2>
          <button onClick={() => router.push("/publish")} className="text-[10px] font-black uppercase bg-teal-600 text-white px-6 py-3 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-teal-600/20">
            Nouveau Manuscrit
          </button>
        </div>
        {loadingTexts ? (
          <div className="flex justify-center p-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200"><Loader2 className="animate-spin text-teal-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {texts.map((text) => (
              <div key={text.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
                <div className="space-y-4">
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[2rem] overflow-hidden relative">
                    {text.imageBase64 ? <img src={text.imageBase64} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FileText size={40} /></div>}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button onClick={() => router.push(`/edit/${text.id}`)} className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl text-slate-600 shadow-xl"><Edit3 size={16}/></button>
                       <button onClick={() => handleDeleteText(text.id)} className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl text-rose-500 shadow-xl"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="px-2">
                    <h3 className="font-black italic text-slate-900 dark:text-white text-lg line-clamp-1">{text.title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(text.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* GRID DU BAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TRANSFERT */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white"><Send size={18} className="text-teal-600"/> Envoyer des Li</h3>
          <div className="space-y-4">
            <input type="email" placeholder="Email destinataire" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none text-sm font-bold dark:text-white" onChange={(e) => setTransfer({...transfer, email: e.target.value})} />
            <input type="number" placeholder="Montant" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none text-sm font-bold dark:text-white" onChange={(e) => setTransfer({...transfer, amount: e.target.value})} />
            <button onClick={handleTransfer} className="w-full bg-slate-950 dark:bg-teal-600 text-white py-5 rounded-2xl font-black uppercase text-[10px]">Confirmer</button>
          </div>
        </div>

        {/* PROGRESSION */}
        <div className="bg-teal-600 p-8 rounded-[3rem] text-white flex flex-col justify-between shadow-xl">
           <TrendingUp size={32} className="mb-6 opacity-50" />
           <div>
              <p className="text-3xl font-black italic mb-4">Objectif Retrait</p>
              <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden">
                <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-[9px] font-black uppercase opacity-60 mt-3">Seuil : 25 000 Li</p>
           </div>
        </div>

        {/* LE BADGE OFFICIEL (VERSION EXACTE DE L'IMAGE) */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div 
            ref={badgeRef} 
            className="w-[400px] h-[400px] bg-[#121E2C] border-[12px] border-[#00A38E] flex flex-col items-center justify-center p-8 relative shadow-2xl"
          >
            <p className="text-[#00A38E] text-[14px] font-black uppercase tracking-[0.5em] mb-8">
              Compte Officiel
            </p>

            <h2 className="text-white text-4xl font-serif italic font-medium text-center leading-tight mb-8 px-4">
              {user?.penName}
            </h2>

            <p className="text-[#EAB308] text-[18px] font-bold tracking-widest mb-10">
              lisible.biz
            </p>

            <div className="w-14 h-14 bg-[#00A38E] rounded-full flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>

          <button 
            onClick={downloadBadgeImage}
            className="w-full max-w-[400px] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all"
          >
            <Download size={16} /> Télécharger le Badge
          </button>
        </div>

      </div>
    </div>
  );
}
