"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Send, TrendingUp, ArrowUpRight, FileText, UserCircle, 
  Download, Award, MessageCircle, Facebook, Instagram, Twitter, Copy, UserPlus 
} from "lucide-react";
import { toast } from "sonner";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });
  const [copied, setCopied] = useState(false);

  const getRank = (sc) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-400", bg: "bg-white/5", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-300", bg: "bg-white/5", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-400", bg: "bg-white/5", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-500", bg: "bg-white/5", icon: "🖋️" };
  };

  const fetchLatestData = useCallback(async (email, pass) => {
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("lisible_user", JSON.stringify(data.user));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      const u = JSON.parse(logged);
      fetchLatestData(u.email, u.password);
    } else { router.push("/login"); }
  }, [router, fetchLatestData]);

  const copyRefLink = () => {
    const link = `${window.location.origin}/login?ref=${btoa(user.email)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = async () => {
    if (transfer.amount < 1000) return toast.error("Minimum 1000 Li");
    const tid = toast.loading("Transfert...");
    try {
      const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, targetEmail: transfer.email, amount: transfer.amount, type: "transfer" }) });
      if (res.ok) { toast.success("Succès !", { id: tid }); fetchLatestData(user.email, user.password); }
      else { toast.error("Échec", { id: tid }); }
    } catch (e) { toast.error("Erreur de connexion", { id: tid }); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  const rank = getRank(user?.wallet?.balance || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl gap-8 border border-white/5">
        <div className="text-center md:text-left">
          <div className={`inline-flex items-center gap-2 ${rank.color} ${rank.bg} px-4 py-2 rounded-2xl mb-4 border border-current/10 animate-in zoom-in`}>
             <span className="text-xl">{rank.icon}</span>
             <span className="text-[10px] font-black uppercase tracking-widest">{rank.name}</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-none">{user?.penName}</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-500 mt-2 italic">Auteur Certifié Lisible</p>
        </div>
        
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-right min-w-[200px]">
          <p className="text-5xl font-black text-amber-400 tracking-tighter">{user?.wallet?.balance || 0} <span className="text-sm">Li</span></p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Solde Disponible</p>
        </div>
      </header>

      {/* SECTION PARRAINAGE DYNAMIQUE */}
      <div className="bg-teal-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-900/10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/20 rounded-2xl"><UserPlus size={24}/></div>
          <div>
            <h3 className="text-lg font-black italic leading-none">Programme Ambassadeur</h3>
            <p className="text-[10px] font-bold uppercase opacity-80 mt-2">Gagnez 500 Li par nouvelle plume recrutée</p>
          </div>
        </div>
        <button onClick={copyRefLink} className="w-full md:w-auto px-8 py-4 bg-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-slate-900 transition-all">
          {copied ? "Lien copié !" : <><Copy size={16}/> Copier mon lien</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => router.push("/publish")} className="group flex items-center justify-between p-8 bg-white border-2 border-slate-50 rounded-[2.5rem] hover:border-teal-500 transition-all shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors"><FileText size={24} /></div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Publier une œuvre</span>
          </div>
          <ArrowUpRight size={20} className="text-slate-300" />
        </button>
        <button onClick={() => router.push("/account")} className="group flex items-center justify-between p-8 bg-white border-2 border-slate-50 rounded-[2.5rem] hover:border-slate-900 transition-all shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors"><UserCircle size={24} /></div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Gérer mon compte</span>
          </div>
          <ArrowUpRight size={20} className="text-slate-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Send size={18}/> Envoyer des Li</h3>
          <div className="space-y-4">
            <input type="email" placeholder="Email destinataire" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold" onChange={(e) => setTransfer({...transfer, email: e.target.value})} />
            <input type="number" placeholder="Montant (Min. 1000)" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-sm font-bold" onChange={(e) => setTransfer({...transfer, amount: e.target.value})} />
            <button onClick={handleTransfer} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all text-[10px]">Confirmer l'envoi</button>
          </div>
        </div>

        <div className="bg-teal-50 p-8 rounded-[3rem] border border-teal-100 flex flex-col justify-between">
           <TrendingUp className="text-teal-600 mb-6" size={30} />
           <div>
              <p className="text-3xl font-black italic text-slate-900 leading-none">Objectif Retrait</p>
              <div className="w-full bg-white h-2 rounded-full mt-4 overflow-hidden shadow-inner">
                <div className="bg-teal-500 h-full transition-all duration-1000" style={{ width: `${Math.min((user?.wallet?.balance / 25000) * 100, 100)}%` }}></div>
              </div>
              <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Progression : {Math.floor((user?.wallet?.balance / 25000) * 100)}%</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-5 shadow-sm">
           <Award size={40} className="text-amber-500" />
           <div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Partagez votre profil</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Augmentez votre influence</p>
           </div>
           <div className="flex gap-2">
              <button className="p-3 bg-slate-50 rounded-xl hover:bg-teal-600 hover:text-white transition-all"><Facebook size={18}/></button>
              <button className="p-3 bg-slate-50 rounded-xl hover:bg-teal-600 hover:text-white transition-all"><Instagram size={18}/></button>
              <button className="p-3 bg-slate-50 rounded-xl hover:bg-teal-600 hover:text-white transition-all"><Twitter size={18}/></button>
           </div>
        </div>
      </div>
    </div>
  );
}
