"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, BookOpen, Star, Sparkles, Wallet, Camera, Lock, Info, KeyRound, Feather, AlignLeft, ChevronDown, ChevronUp
} from "lucide-react";

// Sous-composant pour les statistiques
function AccountStatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: color, size: 22 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
          <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showBioPanel, setShowBioPanel] = useState(false);
  const [formData, setFormData] = useState({ penName: "", birthday: "", profilePic: "", bio: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com", 
    "cmo.lablitteraire7@gmail.com", 
    "robergeaurodley97@gmail.com", 
    "jb7management@gmail.com", 
    "woolsleypierre01@gmail.com", 
    "jeanpierreborlhaïniedarha@gmail.com"
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

  const refreshUserData = async (email) => {
    try {
      const res = await fetch(`/api/github-db?type=user&id=${email}`);
      const libraryRes = await fetch(`/api/github-db?type=library`);
      
      if (res.ok && libraryRes.ok) {
        const data = await res.json();
        const libraryData = await libraryRes.json();
        
        let sortedWorks = [];
        if (libraryData && libraryData.content) {
          sortedWorks = libraryData.content
            .filter(w => w.authorEmail?.toLowerCase() === email.toLowerCase())
            .sort((a, b) => (Number(b.certified || 0) + Number(b.likes || 0)) - (Number(a.certified || 0) + Number(a.likes || 0)));
        }

        const freshUser = {
          ...data.content,
          works: sortedWorks,
          li: data.content?.li || 0,
          followers: data.content?.followers || []
        };
        
        setUser(freshUser);
        setFormData({ 
            penName: freshUser.penName || freshUser.name || "",
            birthday: freshUser.birthday || "",
            profilePic: freshUser.profilePic || freshUser.image || "",
            bio: freshUser.bio || ""
        });
        if (!freshUser.bio) setIsEditingBio(true);
        localStorage.setItem("lisible_user", JSON.stringify(freshUser));
      }
    } catch (e) { 
      const local = JSON.parse(localStorage.getItem("lisible_user"));
      if (local) setUser(local);
    } finally { 
      setLoading(false); 
    }
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const saveProfile = async () => {
    if (isSaving) return;
    
    if (getWordCount(formData.bio) > 500) {
        return toast.error("Votre biographie dépasse la limite de 500 mots.");
    }

    setIsSaving(true);
    const t = toast.loading("Mise à jour du profil...");
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
        setIsEditingBio(false);
        toast.success("Profil mis à jour", { id: t });
      } else {
        throw new Error();
      }
    } catch (e) { 
      toast.error("Erreur de sauvegarde", { id: t }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const updatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return toast.error("Veuillez remplir les deux champs.");
    }
    setIsChangingPassword(true);
    const t = toast.loading("Sécurisation du compte...");
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          userEmail: user.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Mot de passe modifié", { id: t });
        setPasswordData({ currentPassword: "", newPassword: "" });
      } else {
        toast.error(data.message || "Erreur lors du changement", { id: t });
      }
    } catch (e) {
      toast.error("Échec de l'opération", { id: t });
    } finally {
      setIsChangingPassword(false);
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
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Accès au registre...</p>
    </div>
  );

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase().trim());
  const balance = user.li || 0;
  const followersCount = user?.followers?.length || 0;
  const isEligibleForWithdraw = balance >= 25000 && followersCount >= 250;
  const progressToWithdraw = Math.min((balance / 25000) * 100, 100);
  const bioWords = getWordCount(formData.bio);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 pb-32 bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row gap-8 items-center justify-between bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left z-10">
           <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 overflow-hidden border-4 border-white shadow-2xl">
                    <img 
                      src={formData.profilePic || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.email}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt="Profile"
                    />
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer hover:bg-slate-900 shadow-lg transition-all active:scale-90">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
              </div>
              
              <button 
                onClick={() => setShowBioPanel(!showBioPanel)}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors"
              >
                {showBioPanel ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} 
                Biographie
              </button>
           </div>
           
           <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tighter leading-none mb-2">
              {formData.penName || "Ma Plume"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        
        <button onClick={() => router.back()} className="p-5 bg-slate-50 rounded-3xl text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all z-10">
          <ArrowLeft size={24} />
        </button>

        {showBioPanel && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-md p-8 md:p-10 animate-in slide-in-from-bottom duration-500 z-20 border-t border-white/10">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-teal-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Feather size={14}/> Ma Plume en quelques mots
                </h3>
                {user.bio && !isEditingBio && (
                  <button 
                    onClick={() => setIsEditingBio(true)}
                    className="text-white/50 hover:text-white text-[9px] font-black uppercase border border-white/20 px-4 py-1 rounded-full transition-all"
                  >
                    Modifier
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <div className="space-y-4">
                  <textarea 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Partagez votre histoire..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm leading-relaxed outline-none focus:border-teal-500 transition-all h-32 resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black uppercase ${bioWords > 500 ? 'text-rose-500' : 'text-slate-500'}`}>
                      {bioWords} / 500 mots
                    </span>
                    <div className="flex gap-2">
                      {user.bio && (
                        <button onClick={() => setIsEditingBio(false)} className="px-4 py-2 text-[9px] font-black uppercase text-white/40 hover:text-white">Annuler</button>
                      )}
                      <button 
                        onClick={saveProfile} 
                        disabled={isSaving}
                        className="bg-teal-500 text-slate-950 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all"
                      >
                        {isSaving ? "Enregistrement..." : "Confirmer"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-white/80 text-sm leading-relaxed italic font-medium">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AccountStatCard label="Manuscrits" value={user?.works?.length || 0} icon={<BookOpen />} color="text-teal-600" />
        <AccountStatCard label="Abonnés" value={followersCount} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Certifications" value={user?.certified || 0} icon={<ShieldCheck />} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-12">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
              <Edit3 size={18} /> Identité d'Auteur
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button 
              disabled={isSaving} 
              onClick={saveProfile} 
              className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-teal-600 transition-all flex justify-center items-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
              Mettre à jour mes infos
            </button>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
              <KeyRound size={18} /> Sceau de Sécurité
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                <InputBlock 
                  label="Ancien mot de passe" 
                  value={passwordData.currentPassword} 
                  onChange={v => setPasswordData({...passwordData, currentPassword: v})} 
                  type="password"
                />
                <InputBlock 
                  label="Nouveau mot de passe" 
                  value={passwordData.newPassword} 
                  onChange={v => setPasswordData({...passwordData, newPassword: v})} 
                  type="password" 
                />
            </div>

            <button 
              disabled={isChangingPassword} 
              onClick={updatePassword} 
              className="w-full py-6 bg-slate-50 text-slate-900 border border-slate-100 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex justify-center items-center gap-4 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />} 
              Modifier le mot de passe
            </button>
          </div>
        </section>

        <aside className="space-y-8">
          <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-12">
              <Wallet size={24} /> Coffre Li
            </h2>
            
            <div className="space-y-8 relative z-10">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Mon Solde</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black italic tracking-tighter text-white">{balance.toLocaleString()}</span>
                  <span className="text-sm font-bold text-teal-400 uppercase">Li</span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Objectif 25k</span>
                    <span className="text-teal-400">{Math.floor(progressToWithdraw)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000" 
                      style={{ width: `${progressToWithdraw}%` }} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  disabled={!isEligibleForWithdraw}
                  onClick={() => router.push("/withdraw")}
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                    isEligibleForWithdraw 
                    ? 'bg-teal-500 text-slate-950 hover:scale-[1.02] shadow-xl' 
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {!isEligibleForWithdraw && <Lock size={14} />}
                  Demander Retrait (5 USD)
                </button>
                {!isEligibleForWithdraw && (
                    <p className="text-[8px] text-center font-bold text-slate-500 uppercase tracking-tighter">
                      Requis: 25k Li & 250 Abonnés
                    </p>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-amber-500 rounded-[2.5rem] p-8 text-slate-950 shadow-xl border border-amber-400/50">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={24} />
                <h3 className="font-black uppercase text-xs tracking-widest italic">Accès Admin</h3>
              </div>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                Accès prioritaire aux registres de l'Atelier.
              </p>
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
