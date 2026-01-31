"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, RefreshCcw, Save, 
  Layout, Eye, CheckCircle2, Wallet, Sparkles,
  BookOpen, Star, TrendingUp, Download, Award, Crown, Cake
} from "lucide-react";

function AccountStatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: color, size: 20 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // Nécessaire pour le calcul "Plume de la semaine"
  const [loading, setLoading] = useState(true);
  const [isRefreshingLi, setIsRefreshingLi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  const WITHDRAWAL_THRESHOLD = 25000;
  const balance = user?.wallet?.balance || 0;
  const canWithdraw = balance >= WITHDRAWAL_THRESHOLD;
  const isSpecialPartner = user?.email?.toLowerCase() === "cmo.lablitteraire7@gmail.com";

  // --- LOGIQUE DES BADGES ---
  const getEarnedBadges = () => {
    const earned = [];
    if (!user) return earned;

    const email = user.email?.toLowerCase();
    const subs = user.stats?.subscribers || 0;
    const texts = user.stats?.totalTexts || 0;
    const today = new Date();

    // 1. Badge PGD
    if (email === "jb7management@gmail.com") {
      earned.push({ id: 'pgd', label: "PGD", color: "bg-slate-950 text-amber-400 border border-amber-500/30", icon: <Crown size={14}/> });
    }

    // 2. Badge Anniversaire (Valable 24h le jour J)
    if (user.birthday) {
      const bDay = new Date(user.birthday);
      if (bDay.getDate() === today.getDate() && bDay.getMonth() === today.getMonth()) {
        earned.push({ id: 'anniv', label: "Joyeux anniversaire à moi", color: "bg-rose-500 text-white animate-pulse", icon: <Cake size={14}/> });
      }
    }

    // 3. Plume de la semaine (Samedi + Exclusion)
    const excludedEmails = ["jb7management@gmail.com", "adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com"];
    if (today.getDay() === 6 && !excludedEmails.includes(email) && allUsers.length > 0) {
      const eligible = allUsers.filter(u => !excludedEmails.includes(u.email?.toLowerCase()));
      const topWriter = [...eligible].sort((a, b) => (b.stats?.totalTexts || 0) - (a.stats?.totalTexts || 0))[0];
      if (topWriter && email === topWriter.email && texts > 0) {
        earned.push({ id: 'weekly', label: "Plume de la semaine", color: "bg-teal-500 text-white", icon: <TrendingUp size={14}/> });
      }
    }

    // 4. Paliers Classiques
    if (texts >= 1) earned.push({ id: 'plume', label: "Plume Lisible", color: "bg-slate-900 text-white", icon: <Edit3 size={14}/> });
    if (subs >= 250) earned.push({ id: 'bronze', label: "Badge Bronze", color: "bg-orange-700 text-white", icon: <Award size={14}/> });
    if (subs >= 750) earned.push({ id: 'or', label: "Badge Or", color: "bg-amber-400 text-slate-900", icon: <Award size={14}/> });
    if (subs >= 2000) earned.push({ id: 'diamant', label: "Badge Diamant", color: "bg-cyan-400 text-white", icon: <Sparkles size={14}/> });
    
    return earned;
  };

  const downloadBadge = (badgeLabel) => {
    toast.success(`Téléchargement du badge ${badgeLabel}...`);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        refreshUserData(parsed.email);
        loadAllUsers(); // Charger pour le calcul de la plume de la semaine
      } catch (e) { router.push("/login"); }
    } else { router.push("/login"); }
  }, []);

  const loadAllUsers = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      const files = await res.json();
      const dataPromises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(f.download_url).then(r => r.json()));
      const users = await Promise.all(dataPromises);
      setAllUsers(users);
    } catch (e) { console.error(e); }
  };

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
      }
    } catch (e) { console.error(e); } finally { 
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
    const t = toast.loading("Mise à jour...");
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
        toast.success("Profil mis à jour", { id: t });
      }
    } catch (e) { toast.error("Erreur", { id: t }); }
    finally { setIsSaving(false); }
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20">
      {/* HEADER ACTION */}
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20">
              <User size={30} />
           </div>
           <div>
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">Mon Compte</h1>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Identité & Portefeuille</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-slate-50 p-2 pl-6 rounded-3xl border border-slate-100">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
                <span className="text-xl font-black text-slate-900">{balance} <span className="text-[10px] text-teal-600">Li</span></span>
             </div>
             <button onClick={() => refreshUserData(user.email)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all">
               <RefreshCcw size={18} className={isRefreshingLi ? "animate-spin" : ""} />
             </button>
          </div>
          <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AccountStatCard label="Lectures Li" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
        <AccountStatCard label="Manuscrits" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
        <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Visibilité" value={user?.stats?.totalViews || 0} icon={<TrendingUp />} color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          {/* BADGES DE PRESTIGE */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Award size={16} /> Mes Badges & Distinctions
            </h2>
            <div className="flex flex-wrap gap-4">
              {getEarnedBadges().length > 0 ? getEarnedBadges().map((badge) => (
                <div key={badge.id} className={`${badge.color} px-5 py-4 rounded-[1.5rem] flex flex-col items-center gap-3 border shadow-sm group relative`}>
                   <div className="p-2 bg-white/20 rounded-lg">{badge.icon}</div>
                   <span className="text-[9px] font-black uppercase tracking-tighter text-center">{badge.label}</span>
                   <button onClick={() => downloadBadge(badge.label)} className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-all">
                     <Download size={14} />
                   </button>
                </div>
              )) : (
                <p className="text-[10px] font-bold text-slate-400 italic">Aucun badge débloqué pour le moment.</p>
              )}
            </div>
          </div>

          {/* FORMULAIRE IDENTITÉ */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Edit3 size={16} /> Édition du registre
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                  <img src={formData.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl transition-all group-hover:rotate-3" />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-teal-600 shadow-lg">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{formData.penName || "Auteur Lisible"}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {isSpecialPartner ? "Partenaire Officiel" : "Membre Certifié"}
                  </span>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {!isSpecialPartner && (
                <>
                  <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                  <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                </>
              )}
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>
            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Mettre à jour mon profil
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-10">
              <CreditCard size={24} /> Trésorerie
            </h2>
            <div className="space-y-8">
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Progression Seuil</p>
                      <p className="text-2xl font-black">{balance} <span className="text-[10px] text-slate-500">/ {WITHDRAWAL_THRESHOLD} Li</span></p>
                    </div>
                    <Wallet className="text-teal-500 opacity-20" size={32} />
                 </div>
                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${Math.min((balance / WITHDRAWAL_THRESHOLD) * 100, 100)}%` }} />
                 </div>
              </div>
              <button onClick={handleWithdraw} disabled={!canWithdraw} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canWithdraw ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}>
                Demander le versement
              </button>
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900" />
    </div>
  );
}
