"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, Wallet, Camera, Lock, KeyRound
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // États pour les formulaires
  const [formData, setFormData] = useState({ penName: "", birthday: "", profilePic: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", 
    "robergeaurodley97@gmail.com", "jb7management@gmail.com", 
    "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      refreshUserData(parsed.email);
    } else { 
      router.push("/login"); 
    }
  }, [router]);

  // RÉCUPÉRATION DES DONNÉES SUR GITHUB (data/users & data/publications)
  const refreshUserData = async (email) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // 1. Chercher l'utilisateur dans data/users
      const userRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(cleanEmail)}`);
      
      // 2. Chercher ses publications dans data/publications pour les stats réelles
      const libraryRes = await fetch(`/api/github-db?type=library`);
      
      if (userRes.ok && libraryRes.ok) {
        const userData = await userRes.json();
        const libraryData = await libraryRes.json();
        
        const content = userData.content || {};
        const allLibrary = libraryData.content || [];

        // Calcul des stats réelles depuis la bibliothèque
        const userWorks = allLibrary.filter(w => w.authorEmail?.toLowerCase().trim() === cleanEmail);
        const totalCertified = userWorks.reduce((acc, curr) => acc + Number(curr.certified || 0), 0);
        
        const freshUser = {
          ...content,
          email: cleanEmail,
          li: Number(content.li || 0),
          followers: content.followers || [],
          certified: totalCertified, // Donnée issue de data/publications
          worksCount: userWorks.length
        };
        
        setUser(freshUser);
        setFormData({ 
            penName: freshUser.penName || freshUser.name || "",
            birthday: freshUser.birthday || "",
            profilePic: freshUser.profilePic || freshUser.image || ""
        });
        
        // Update du cache local
        localStorage.setItem("lisible_user", JSON.stringify(freshUser));
      }
    } catch (e) { 
      console.error("Erreur de synchro GitHub:", e);
      const local = JSON.parse(localStorage.getItem("lisible_user"));
      if (local) setUser(local);
    } finally { 
      setLoading(false); 
    }
  };

  const saveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const t = toast.loading("Mise à jour sur GitHub...");
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'update_user', 
          userEmail: user.email, 
          ...formData 
        }) 
      });
      
      if (res.ok) {
        const updated = { ...user, ...formData };
        localStorage.setItem("lisible_user", JSON.stringify(updated));
        setUser(updated);
        toast.success("Profil synchronisé", { id: t });
      }
    } catch (e) { 
      toast.error("Erreur lors de la sauvegarde", { id: t }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2Mo)");
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
      reader.readAsDataURL(file);
    }
  };

  if (loading || !user) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Lecture des données GitHub...</p>
    </div>
  );

  const balance = user.li || 0;
  const progressToWithdraw = Math.min((balance / 25000) * 100, 100);
  const isEligibleForWithdraw = balance >= 25000 && (user.followers?.length >= 250);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 pb-32 bg-[#FCFBF9]">
      {/* Header Profil */}
      <header className="flex flex-col md:flex-row gap-8 items-center justify-between bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 overflow-hidden border-4 border-white shadow-2xl">
                <img 
                  src={formData.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.email}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt="Profile"
                />
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer hover:bg-slate-900 shadow-lg transition-all">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
           </div>
           <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tighter leading-none mb-2">
              {formData.penName || "Utilisateur"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-5 bg-slate-50 rounded-3xl text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 transition-all">
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-12">
          {/* Identité */}
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
              <Edit3 size={18} /> Identité d'Auteur
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>
            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-teal-600 transition-all flex justify-center items-center gap-4">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Enregistrer sur GitHub
            </button>
          </div>

          {/* Mot de passe */}
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
              <KeyRound size={18} /> Sécurité
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                <InputBlock label="Ancien mot de passe" value={passwordData.currentPassword} onChange={v => setPasswordData({...passwordData, currentPassword: v})} type="password" />
                <InputBlock label="Nouveau mot de passe" value={passwordData.newPassword} onChange={v => setPasswordData({...passwordData, newPassword: v})} type="password" />
            </div>
            <button className="w-full py-6 bg-slate-50 text-slate-900 border border-slate-100 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-rose-50 hover:text-rose-600 transition-all flex justify-center items-center gap-4">
               <Lock size={20} /> Modifier le mot de passe
            </button>
          </div>
        </section>

        {/* Sidebar : Portefeuille & Statut Admin */}
        <aside className="space-y-8">
          <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-12">
              <Wallet size={24} /> Coffre Li
            </h2>
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 mb-8">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Mon Solde Réel</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic tracking-tighter text-white">{balance.toLocaleString()}</span>
                <span className="text-sm font-bold text-teal-400 uppercase">Li</span>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Palier Retrait</span>
                  <span className="text-teal-400">{Math.floor(progressToWithdraw)}%</span>
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${progressToWithdraw}%` }} />
                </div>
              </div>
            </div>
            <button disabled={!isEligibleForWithdraw} className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isEligibleForWithdraw ? 'bg-teal-500 text-slate-950' : 'bg-white/5 text-slate-600'}`}>
              Demander Retrait
            </button>
          </div>

          {ADMIN_EMAILS.includes(user.email) && (
            <div className="bg-amber-500 rounded-[2.5rem] p-8 text-slate-950 shadow-xl border border-amber-400/50">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={24} />
                <h3 className="font-black uppercase text-xs tracking-widest italic">Accès Admin</h3>
              </div>
              <p className="text-[10px] font-bold opacity-80 uppercase leading-tight">Accès total aux fichiers data/ sur GitHub.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-6 tracking-[0.2em]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50/50 border-2 border-slate-50 focus:border-teal-500/20 focus:bg-white rounded-3xl p-6 text-sm font-bold outline-none transition-all text-slate-900 shadow-inner" 
      />
    </div>
  );
}
