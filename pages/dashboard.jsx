"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Coins, ShieldCheck, Send, LogOut, TrendingUp, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { formatLi } from "@/lib/utils";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });

  const fetchLatestData = useCallback(async (email) => {
    try {
      // On utilise l'API login pour rafraîchir les données proprement
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER SOLDE */}
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex justify-between items-center shadow-2xl">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">{user?.penName}</h1>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mt-2">Membre Lisible certifié</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black text-amber-400 tracking-tighter">{formatLi(user?.wallet?.balance)} <span className="text-sm">Li</span></p>
          <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest">Disponible immédiatement</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MODULE TRANSFERT */}
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Send size={18}/> Envoyer des Li</h3>
          <p className="text-xs text-slate-500">Soutenez un autre auteur. Minimum 1000 Li.</p>
          <div className="space-y-4">
            <input 
              type="email" placeholder="Email du destinataire" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500"
              onChange={(e) => setTransfer({...transfer, email: e.target.value})}
            />
            <input 
              type="number" placeholder="Montant (ex: 1500)" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 ring-teal-500"
              onChange={(e) => setTransfer({...transfer, amount: e.target.value})}
            />
            <button onClick={handleTransfer} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
              Confirmer l'envoi
            </button>
          </div>
        </div>

        {/* STATS RAPIDES */}
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
              <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Objectif : 25 000 Li (5.00$)</p>
           </div>
        </div>
      </div>
    </div>
  );
}
