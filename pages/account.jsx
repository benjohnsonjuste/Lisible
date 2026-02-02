"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, RefreshCcw, Save, 
  Layout, Eye, CheckCircle2, Wallet, Sparkles,
  BookOpen, Star, TrendingUp, Download, Award, Crown, Cake,
  Mail, Landmark, Globe, Key, Trash2, AlertTriangle
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
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // --- ÉTAT DU FORMULAIRE ---
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: "",
    paymentMethod: "PayPal",
    paypalEmail: "",
    wuFirstName: "",
    wuLastName: "",
    wuCountry: ""
  });

  const [passData, setPassData] = useState({ current: "", new: "" });

  const WITHDRAWAL_THRESHOLD = 25000;
  const balance = user?.wallet?.balance || 0;
  const canWithdraw = balance >= WITHDRAWAL_THRESHOLD;

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
      // Encodage Base64 standard identique à l'API de suppression
      const fileName = btoa(email.toLowerCase().trim()).replace(/=/g, "");
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${fileName}.json?t=${Date.now()}`);
      if (res.ok) {
        const file = await res.json();
        const freshUser = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
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
    const t = toast.loading("Mise à jour...");
    try {
      const updatedUser = { 
        ...user, 
        ...formData,
        wuMoneyGram: { firstName: formData.wuFirstName, lastName: formData.wuLastName, country: formData.wuCountry }
      };
      const res = await fetch('/api/update-user', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, userData: updatedUser })
      });
      if (res.ok) {
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Profil sauvegardé", { id: t });
      }
    } catch (e) { toast.error("Erreur", { id: t }); } finally { setIsSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (!passData.current || !passData.new) return toast.error("Champs requis");
    setIsUpdatingPass(true);
    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, currentPassword: passData.current, newPassword: passData.new })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Mot de passe mis à jour");
        setPassData({ current: "", new: "" });
      } else { toast.error(data.error); }
    } catch (e) { toast.error("Erreur de connexion"); } finally { setIsUpdatingPass(false); }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Cette action est irréversible. Toutes vos Li et manuscrits seront supprimés. Confirmer ?");
    if (!confirm) return;
    setIsDeleting(true);
    const tId = toast.loading("Suppression définitive en cours...");
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        toast.success("Compte supprimé. Adieu.", { id: tId });
        localStorage.clear();
        router.push("/login");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur de suppression", { id: tId });
        setIsDeleting(false);
      }
    } catch (e) { 
        toast.error("Erreur système", { id: tId }); 
        setIsDeleting(false); 
    }
  };

  const handleWithdraw = () => router.push("/withdraw");

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

            {formData.paymentMethod === "PayPal" ? (
               <InputBlock label="Email PayPal" value={formData.paypalEmail} onChange={v => setFormData({...formData, paypalEmail: v})} />
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputBlock label="Prénom" value={formData.wuFirstName} onChange={v => setFormData({...formData, wuFirstName: v})} />
                  <InputBlock label="Nom" value={formData.wuLastName} onChange={v => setFormData({...formData, wuLastName: v})} />
                  <div className="sm:col-span-2"><InputBlock label="Pays" value={formData.wuCountry} onChange={v => setFormData({...formData, wuCountry: v})} /></div>
               </div>
            )}

            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3 shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sauvegarder les infos
            </button>
          </div>

          {/* SECTION : SÉCURITÉ (CHANGER MOT DE PASSE) */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-8">
            <h2 className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Key size={16} /> Sécurité de l'accès
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputBlock label="Secret actuel" type="password" value={passData.current} onChange={v => setPassData({...passData, current: v})} />
              <InputBlock label="Nouveau secret" type="password" value={passData.new} onChange={v => setPassData({...passData, new: v})} />
            </div>
            <button disabled={isUpdatingPass} onClick={handleUpdatePassword} className="w-full py-5 border-2 border-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all">
              {isUpdatingPass ? <Loader2 className="animate-spin mx-auto" /> : "Actualiser mon secret"}
            </button>
          </div>

          {/* ZONE DANGEREUSE */}
          <div className="bg-rose-50 rounded-[3rem] p-8 md:p-12 border border-rose-100 space-y-6">
            <div className="flex items-center gap-4 text-rose-600">
              <AlertTriangle size={24} />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Zone de rupture</h2>
            </div>
            <p className="text-xs text-rose-800 font-medium">La suppression de votre compte est définitive. Toutes vos données, manuscrits et vos Li accumulés seront supprimés de nos serveurs sans possibilité de récupération.</p>
            <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
              <Trash2 size={16} /> Supprimer mon compte
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
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${Math.min((balance / WITHDRAWAL_THRESHOLD) * 100, 100)}%` }} />
                 </div>
              </div>
              <button onClick={handleWithdraw} disabled={!canWithdraw} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${canWithdraw ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"}`}>
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