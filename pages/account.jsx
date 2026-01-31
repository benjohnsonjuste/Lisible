"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, RefreshCcw, Save, 
  Layout, Eye, CheckCircle2, Wallet, Sparkles,
  BookOpen, Star, TrendingUp, Download, Award, Crown, Cake,
  Mail, Landmark, Globe
} from "lucide-react";

// --- COMPOSANT STATS ---
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
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshingLi, setIsRefreshingLi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- ÉTAT DU FORMULAIRE (AVEC MODES DE PAIEMENT) ---
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: "",
    paymentMethod: "PayPal", // PayPal ou Western Union
    paypalEmail: "",
    wuFirstName: "",
    wuLastName: "",
    wuCountry: ""
  });

  const WITHDRAWAL_THRESHOLD = 25000;
  const balance = user?.wallet?.balance || 0;
  const canWithdraw = balance >= WITHDRAWAL_THRESHOLD;
  const isSpecialPartner = user?.email?.toLowerCase() === "cmo.lablitteraire7@gmail.com";

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        refreshUserData(parsed.email);
        loadAllUsers();
      } catch (e) { router.push("/login"); }
    } else { router.push("/login"); }
  }, []);

  const loadAllUsers = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${Date.now()}`);
      if (!res.ok) return;
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
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(email.toLowerCase()).replace(/=/g, "")}.json?t=${Date.now()}`);
      if (res.ok) {
        const file = await res.json();
        const freshUser = JSON.parse(decodeURIComponent(escape(atob(file.content))));
        setUser(freshUser);
        setFormData({
          firstName: freshUser.firstName || "",
          lastName: freshUser.lastName || "",
          penName: freshUser.penName || freshUser.name || "",
          birthday: freshUser.birthday || "",
          profilePic: freshUser.profilePic || "",
          paymentMethod: freshUser.paymentMethod || "PayPal",
          paypalEmail: freshUser.paypalEmail || "",
          wuFirstName: freshUser.wuMoneyGram?.firstName || "",
          wuLastName: freshUser.wuMoneyGram?.lastName || "",
          wuCountry: freshUser.wuMoneyGram?.country || ""
        });
      }
    } catch (e) { console.error(e); } finally { 
      setIsRefreshingLi(false); 
      setLoading(false); 
    }
  };

  const saveProfile = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    const t = toast.loading("Mise à jour et synchronisation financière...");
    
    try {
      const updatedUser = { 
        ...user, 
        ...formData,
        wuMoneyGram: {
          firstName: formData.wuFirstName,
          lastName: formData.wuLastName,
          country: formData.wuCountry
        }
      };

      // 1. Sauvegarde sur GitHub
      const res = await fetch('/api/update-user', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userData: updatedUser })
      });

      if (res.ok) {
        // 2. Envoi des données par Email au staff (Finance)
        await fetch('/api/notify-staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: "UPDATE_PROFILE_FINANCE",
                userEmail: user.email,
                penName: formData.penName,
                paymentData: formData
            })
        });

        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Profil & Infos de paiement sauvegardés", { id: t });
      }
    } catch (e) { 
      toast.error("Erreur de sauvegarde", { id: t }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleWithdraw = () => {
    router.push("/withdraw");
  };

  // --- LOGIQUE DES BADGES ---
  const getEarnedBadges = () => {
    const earned = [];
    if (!user) return earned;
    const subs = user.stats?.subscribers || 0;
    const texts = user.stats?.totalTexts || 0;
    if (texts >= 1) earned.push({ id: 'plume', label: "Plume Lisible", color: "bg-slate-900 text-white", icon: <Edit3 size={14}/> });
    if (subs >= 250) earned.push({ id: 'bronze', label: "Badge Bronze", color: "bg-orange-700 text-white", icon: <Award size={14}/> });
    return earned;
  };

  if (loading || !user) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Accès sécurisé...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 animate-in fade-in duration-700">
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
          <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AccountStatCard label="Lectures Li" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
        <AccountStatCard label="Manuscrits" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
        <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Visibilité" value={user?.stats?.totalViews || 0} icon={<TrendingUp />} color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          {/* SECTION : ÉDITION PROFIL */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Edit3 size={16} /> Registre Public
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                  <img src={formData.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl transition-all group-hover:scale-105" alt="Profil" />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-teal-600 shadow-lg transition-all active:scale-90">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{formData.penName || "Auteur"}</p>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Membre Certifié Lisible</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <hr className="border-slate-100" />

            {/* SECTION : PAIEMENT INTÉGRÉE */}
            <h2 className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 mt-10">
               <CreditCard size={16} /> Configuration des Retraits
            </h2>

            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setFormData({...formData, paymentMethod: "PayPal"})} className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.paymentMethod === "PayPal" ? "border-teal-500 bg-teal-50" : "border-slate-50 bg-slate-50 opacity-40"}`}>
                  <Mail className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase">PayPal</span>
               </button>
               <button onClick={() => setFormData({...formData, paymentMethod: "Western Union"})} className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.paymentMethod === "Western Union" ? "border-teal-500 bg-teal-50" : "border-slate-50 bg-slate-50 opacity-40"}`}>
                  <Landmark className="text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">W. Union / MG</span>
               </button>
            </div>

            <div className="animate-in slide-in-from-top-4 duration-500">
               {formData.paymentMethod === "PayPal" ? (
                  <InputBlock label="Adresse Email PayPal" value={formData.paypalEmail} onChange={v => setFormData({...formData, paypalEmail: v})} placeholder="votre-email@paypal.com" />
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <InputBlock label="Prénom Bénéficiaire" value={formData.wuFirstName} onChange={v => setFormData({...formData, wuFirstName: v})} />
                     <InputBlock label="Nom Bénéficiaire" value={formData.wuLastName} onChange={v => setFormData({...formData, wuLastName: v})} />
                     <div className="sm:col-span-2">
                        <InputBlock label="Pays de résidence" value={formData.wuCountry} onChange={v => setFormData({...formData, wuCountry: v})} placeholder="Ex: France, Haïti, Canada..." />
                     </div>
                  </div>
               )}
            </div>

            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3 shadow-xl active:scale-[0.98]">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sauvegarder et Synchroniser
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24 border border-white/5">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-10">
              <CreditCard size={24} /> Trésorerie
            </h2>
            <div className="space-y-8">
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                 <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Solde Actuel</p>
                      <p className="text-2xl font-black italic">{balance.toLocaleString()} Li</p>
                      <p className="text-[10px] text-teal-400 font-black mt-1 uppercase tracking-widest">${(balance * 0.0002).toFixed(2)} USD</p>
                    </div>
                    <Wallet className="text-teal-500 opacity-20" size={32} />
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${Math.min((balance / WITHDRAWAL_THRESHOLD) * 100, 100)}%` }} />
                 </div>
              </div>
              <button onClick={handleWithdraw} disabled={!canWithdraw} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${canWithdraw ? "bg-teal-500 text-slate-950 hover:scale-105" : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"}`}>
                Aller au retrait
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900 shadow-inner" />
    </div>
  );
}
