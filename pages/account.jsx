"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, RefreshCcw, Save, 
  Layout, BarChart3, Eye, CheckCircle2, Wallet
} from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingLi, setIsRefreshingLi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  // Sécurisation de la vérification partenaire
  const isSpecialPartner = user?.email?.toLowerCase() === "cmo.lablitteraire7@gmail.com";
  
  const WITHDRAWAL_THRESHOLD = 25000;
  const canWithdraw = (user?.wallet?.balance || 0) >= WITHDRAWAL_THRESHOLD;

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        refreshUserData(parsed.email);
      } catch (e) {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, []);

  const refreshUserData = async (email) => {
    if (!email) return;
    setIsRefreshingLi(true);
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${email.toLowerCase().trim()}.json?t=${Date.now()}`);
      if (res.ok) {
        const file = await res.json();
        const freshUser = JSON.parse(decodeURIComponent(escape(atob(file.content))));
        setUser(freshUser);
        
        setFormData({
          firstName: freshUser.firstName || "",
          lastName: freshUser.lastName || "",
          penName: freshUser.penName || freshUser.name || "",
          birthday: freshUser.birthday || "",
          profilePic: freshUser.profilePic || ""
        });
        
        // Suppression de l'appel à loadPartnerData() inexistant pour éviter le crash
      }
    } catch (e) { 
      console.error("Erreur de récupération:", e); 
    } finally { 
      setIsRefreshingLi(false); 
      setLoading(false); 
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2Mo)");
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    const t = toast.loading("Mise à jour du registre...");
    try {
      const updatedUser = { ...user, ...formData };
      const res = await fetch('/api/update-user', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userData: updatedUser })
      });

      if (res.ok) {
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Profil mis à jour avec succès", { id: t });
      } else { throw new Error(); }
    } catch (e) { toast.error("Erreur de sauvegarde", { id: t }); }
    finally { setIsSaving(false); }
  };

  const handleWithdraw = () => {
    if (!canWithdraw) return toast.info(`Seuil de ${WITHDRAWAL_THRESHOLD} Li non atteint.`);
    toast.success("Demande de versement transmise à l'administration.");
  };

  if (loading || !user) return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-2" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Accès au registre...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <User size={32} />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Identité & Trésorerie</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 bg-slate-50 p-2 pl-6 rounded-3xl border border-slate-100">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Solde Actuel</span>
                <span className="text-2xl font-black text-slate-900">{(user?.wallet?.balance || 0)} <span className="text-xs text-teal-600">Li</span></span>
             </div>
             <button onClick={() => refreshUserData(user.email)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all">
               <RefreshCcw size={20} className={isRefreshingLi ? "animate-spin" : ""} />
             </button>
          </div>
          <button onClick={() => router.back()} className="p-4 border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          {/* IDENTITÉ */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-[11px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Edit3 size={18} /> Configuration du Profil
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
               <div className="relative">
                  <img 
                    src={formData.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.email} 
                    className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-2xl transition-transform group-hover:scale-105" 
                    alt="Profil" 
                  />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-xl cursor-pointer hover:bg-slate-900 transition-all shadow-lg">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-2xl font-black text-slate-900 italic leading-none mb-2">{formData.penName || user?.penName || user?.firstName}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
                    {isSpecialPartner ? (
                      <><Layout size={14} className="text-teal-600" /> Partenaire Lisible</>
                    ) : (
                      <><CheckCircle2 size={14} className="text-teal-600" /> Membre du Club</>
                    )}
                  </span>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {!isSpecialPartner && (
                <>
                  <InputBlock label="Prénom Civil" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                  <InputBlock label="Nom Civil" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                </>
              )}
              <InputBlock label="Pseudonyme" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button 
              disabled={isSaving}
              onClick={saveProfile} 
              className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Sauvegarder les modifications
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8">
              <CreditCard size={24} /> Versements
            </h2>
            
            <div className="space-y-8">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Progression Seuil</p>
                      <p className="text-2xl font-black">{user?.wallet?.balance || 0} <span className="text-xs text-slate-500">/ {WITHDRAWAL_THRESHOLD} Li</span></p>
                    </div>
                    <Wallet className="text-teal-500 opacity-20" size={40} />
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-1000" 
                      style={{ width: `${Math.min(((user?.wallet?.balance || 0) / WITHDRAWAL_THRESHOLD) * 100, 100)}%` }} 
                    />
                 </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleWithdraw}
                  disabled={!canWithdraw}
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    canWithdraw 
                    ? "bg-teal-500 text-slate-950 hover:scale-[1.02] shadow-xl shadow-teal-500/20" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Demander le versement
                </button>
                <p className="text-[9px] text-center text-slate-500 font-medium px-4">
                  Le versement est disponible une fois le seuil de {WITHDRAWAL_THRESHOLD} Li atteint.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all" 
      />
    </div>
  );
}
