"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Edit3, ArrowLeft, ShieldCheck, Loader2, Save, BookOpen, Star, 
  Wallet, Camera, Lock, KeyRound, Feather, ChevronDown, ChevronUp,
  LayoutDashboard
} from "lucide-react";

const GITHUB = { owner: "benjohnsonjuste", repo: "Lisible" };
const ADMINS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

function AccountStatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: color, size: 22 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-6 tracking-[0.2em]">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 focus:border-teal-500/20 focus:bg-white rounded-3xl p-6 text-sm font-bold outline-none transition-all shadow-inner" />
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

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) refreshUserData(JSON.parse(stored).email);
    else router.push("/login");
  }, []);

  const refreshUserData = async (email) => {
    try {
      const emailKey = email.toLowerCase().trim();
      
      // 1. Récupération du profil réel depuis data/users (Source de vérité)
      const uRes = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(emailKey)}`);
      if (!uRes.ok) throw new Error();
      const uData = await uRes.json();
      const uJson = uData.content;

      // 2. Récupération des publications pour les stats réelles (data/publications)
      const libRes = await fetch(`/api/github-db?type=library`);
      let authorWorks = [];
      let totalCertified = 0;

      if (libRes.ok) {
        const libData = await libRes.json();
        const allWorks = libData.content || [];
        authorWorks = allWorks.filter(t => t.authorEmail?.toLowerCase().trim() === emailKey);
        totalCertified = authorWorks.reduce((acc, curr) => acc + Number(curr.certified || 0), 0);
      }

      // 3. Fusion des données
      const fresh = { 
        ...uJson, 
        works: authorWorks, 
        certified: totalCertified,
        followers: uJson.followers || [],
        following: uJson.following || []
      };

      setUser(fresh);
      setFormData({ 
        penName: fresh.penName || fresh.name || "", 
        birthday: fresh.birthday || "", 
        profilePic: fresh.profilePic || fresh.image || "", 
        bio: fresh.bio || "" 
      });
      
      localStorage.setItem("lisible_user", JSON.stringify(fresh));
    } catch (e) {
      console.error("Refresh error:", e);
      setUser(JSON.parse(localStorage.getItem("lisible_user")));
    } finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const t = toast.loading("Mise à jour de votre plume...");
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'update_user', userEmail: user.email, ...formData }) 
      });
      if (res.ok) {
        setUser({ ...user, ...formData });
        setIsEditingBio(false);
        toast.success("Profil synchronisé !", { id: t });
        // Mettre à jour le cache local
        const updatedLocal = { ...user, ...formData };
        localStorage.setItem("lisible_user", JSON.stringify(updatedLocal));
      }
    } catch (e) { toast.error("Erreur de sauvegarde", { id: t }); }
    finally { setIsSaving(false); }
  };

  const updatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) return toast.error("Champs requis");
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'change_password', userEmail: user.email, ...passwordData }) 
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mot de passe modifié");
        setPasswordData({ currentPassword: "", newPassword: "" });
      } else toast.error(data.message);
    } catch (e) { toast.error("Échec de la modification"); }
    finally { setIsChangingPassword(false); }
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const isAdmin = ADMINS.includes(user.email?.toLowerCase().trim());
  const balance = user.li || 0;
  const followersCount = user.followers?.length || 0;
  const isEligible = balance >= 25000 && followersCount >= 250;
  const progress = Math.min((balance / 25000) * 100, 100);

  // Définition de l'image de profil : Photo réelle > Image > Avatar
  const profileImage = formData.profilePic || user.profilePic || user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.penName || user.name || user.email}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 pb-32 bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row gap-8 items-center justify-between bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 overflow-hidden border-4 border-white shadow-2xl relative">
                <img 
                  src={profileImage} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt="Profile" 
                />
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer hover:bg-slate-900 transition-all shadow-lg">
                <Camera size={18} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={e => {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
                    reader.readAsDataURL(e.target.files[0]);
                  }} 
                />
              </label>
            </div>
            <button onClick={() => setShowBioPanel(!showBioPanel)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 hover:text-teal-600 transition-colors">
              {showBioPanel ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} Biographie
            </button>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tighter">
              {formData.penName || user.name || "Ma Plume"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => router.push('/studio')} className="p-5 bg-teal-50 text-teal-600 rounded-3xl hover:bg-teal-600 hover:text-white transition-all shadow-sm" title="Studio"><LayoutDashboard size={24} /></button>
          <button onClick={() => router.back()} className="p-5 bg-slate-50 rounded-3xl text-slate-400 hover:text-slate-900 transition-all"><ArrowLeft size={24} /></button>
        </div>

        {showBioPanel && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-md p-10 animate-in slide-in-from-bottom duration-500 z-20 border-t border-white/10">
            <div className="max-w-3xl mx-auto space-y-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-teal-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <Feather size={14}/> Ma Plume
                </h3>
                {!isEditingBio && (
                  <button onClick={() => setIsEditingBio(true)} className="text-white/50 text-[9px] font-black uppercase border border-white/20 px-4 py-1 rounded-full hover:text-white hover:border-white transition-all">
                    Modifier
                  </button>
                )}
              </div>
              {isEditingBio ? (
                <div className="space-y-4">
                  <textarea 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm outline-none h-32 focus:border-teal-500/50" 
                    placeholder="Racontez votre histoire..."
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditingBio(false)} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase text-white/50">Annuler</button>
                    <button onClick={saveProfile} className="bg-teal-500 text-slate-950 px-6 py-2 rounded-xl text-[9px] font-black uppercase font-bold">Sauvegarder</button>
                  </div>
                </div>
              ) : (
                <p className="text-white/80 italic leading-relaxed">
                  {user.bio ? `"${user.bio}"` : "Aucune biographie n'a encore été rédigée."}
                </p>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AccountStatCard label="Manuscrits" value={user.works?.length || 0} icon={<BookOpen />} color="text-teal-600" />
        <AccountStatCard label="Abonnés" value={followersCount} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Certifications" value={user.certified || 0} icon={<ShieldCheck />} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-12">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3"><Edit3 size={18} /> Identité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>
            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-xs hover:bg-teal-600 transition-all flex justify-center gap-4 shadow-xl shadow-slate-900/10">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Confirmer les modifications
            </button>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3"><Lock size={18} /> Sécurité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
              <InputBlock label="Ancien mot de passe" value={passwordData.currentPassword} onChange={v => setPasswordData({...passwordData, currentPassword: v})} type="password" />
              <InputBlock label="Nouveau mot de passe" value={passwordData.newPassword} onChange={v => setPasswordData({...passwordData, newPassword: v})} type="password" />
            </div>
            <button disabled={isChangingPassword} onClick={updatePassword} className="w-full py-6 bg-slate-50 text-slate-900 border border-slate-100 rounded-[2rem] font-black uppercase text-xs hover:bg-rose-50 hover:text-rose-600 transition-all">
              {isChangingPassword ? <Loader2 className="animate-spin" size={20} /> : <KeyRound size={20} />} Changer de mot de passe
            </button>
          </div>
        </section>

        <aside className="space-y-8">
          <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Wallet size={120} />
            </div>
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-12 relative z-10"><Wallet size={24} /> Coffre Li</h2>
            <div className="space-y-8 relative z-10">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Solde Temps Réel</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black italic text-white">{balance.toLocaleString()}</span>
                  <span className="text-sm font-bold text-teal-400">Li</span>
                </div>
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Objectif 25k</span>
                    <span className="text-teal-400">{Math.floor(progress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-1000" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>
              </div>
              <button 
                disabled={!isEligible} 
                onClick={() => router.push("/withdraw")} 
                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isEligible ? 'bg-teal-500 text-slate-950 shadow-xl hover:scale-105' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
              >
                Retrait disponible (5 USD)
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="bg-amber-400 rounded-[2.5rem] p-8 text-slate-950 shadow-xl flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-2xl text-amber-400 shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-black uppercase text-xs italic tracking-widest">Accès Administrateur</h3>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
