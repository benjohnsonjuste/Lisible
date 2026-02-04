"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, BookOpen, Star, TrendingUp, Sparkles, Key, Trash2, AlertTriangle, Mail, Landmark, Wallet, Lock
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
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", penName: "", birthday: "", profilePic: "" });
  const [passData, setPassData] = useState({ current: "", new: "" });

  const ADMIN_EMAILS = ["adm.lablitteraire7@gmail.com", "cmo.lablitteraire7@gmail.com", "robergeaurodley97@gmail.com", "jb7management@gmail.com", "woolsleypierre01@gmail.com", "jeanpierreborlhaïniedarha@gmail.com"];

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData({ ...parsed, penName: parsed.penName || parsed.name || "" });
      setLoading(false);
      refreshUserData(parsed.email); // Sync automatique en arrière-plan
    } else { router.push("/login"); }
  }, []);

  const refreshUserData = async (email) => {
    try {
      const res = await fetch(`/api/get-user-github?email=${email}`);
      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        localStorage.setItem("lisible_user", JSON.stringify(freshUser));
      }
    } catch (e) { console.error("Sync error:", e); }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const t = toast.loading("Mise à jour du profil...");
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
        toast.success("Profil sauvegardé", { id: t });
      }
    } catch (e) { toast.error("Erreur serveur", { id: t }); } finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!passData.current || !passData.new) return toast.error("Remplissez les champs");
    const t = toast.loading("Sécurisation...");
    try {
      const res = await fetch('/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, oldPassword: passData.current, newPassword: passData.new })
      });
      if (res.ok) {
        toast.success("Mot de passe modifié", { id: t });
        setPassData({ current: "", new: "" });
      } else { toast.error("Ancien mot de passe incorrect", { id: t }); }
    } catch (e) { toast.error("Erreur", { id: t }); }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Cette action est irréversible. Toutes vos œuvres et vos Li seront définitivement supprimés. Confirmer ?");
    if (!confirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        localStorage.clear();
        router.push("/");
        toast.success("Compte supprimé");
      }
    } catch (e) { toast.error("Erreur de suppression"); setIsDeleting(false); }
  };

  const handleWithdrawRequest = () => {
    const balance = user?.wallet?.balance || 0;
    if (balance < 25000) {
      toast.error(`Minimum de 25 000 Li requis.`, { icon: <AlertTriangle className="text-rose-500" size={20} /> });
      return;
    }
    router.push("/withdraw");
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase().trim());
  const isWithdrawDisabled = (user?.wallet?.balance || 0) < 25000;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 animate-in fade-in duration-700 font-sans bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className={`p-4 rounded-2xl ${isAdmin ? 'bg-slate-900' : 'bg-teal-600'} text-white shadow-xl`}><User size={30} /></div>
           <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isAdmin ? 'Administration' : 'Compte Certifié'}</p>
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">Paramètres</h1>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /></button>
      </header>

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl group transition-all">
             <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Solde Actuel</p>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black italic">{user?.wallet?.balance || 0}</span>
               <span className="text-xs font-bold text-teal-400">Li</span>
             </div>
          </div>
          <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
          <AccountStatCard label="Textes" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
          <AccountStatCard label="Certifications" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-50 space-y-10">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Edit3 size={16} /> Profil Public</h2>
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                  <img src={formData.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl transition-all" />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-teal-600 shadow-lg transition-all active:scale-90">
                    <Camera size={18} /><input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result }); reader.readAsDataURL(file); } }} />
                  </label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{formData.penName || "Auteur"}</p>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{user.email}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Lock size={16} /> Sécurité</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <input type="password" placeholder="Ancien mot de passe" className="p-4 bg-slate-50 rounded-xl text-sm outline-none border-2 border-transparent focus:border-teal-500/20" onChange={e => setPassData({...passData, current: e.target.value})} />
                 <input type="password" placeholder="Nouveau mot de passe" className="p-4 bg-slate-50 rounded-xl text-sm outline-none border-2 border-transparent focus:border-teal-500/20" onChange={e => setPassData({...passData, new: e.target.value})} />
               </div>
               <button onClick={handleChangePassword} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">Mettre à jour le mot de passe</button>
            </div>

            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3 shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Enregistrer le profil
            </button>

            <div className="pt-10 border-t border-rose-50">
               <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 p-4 rounded-2xl transition-all">
                 <Trash2 size={16} /> Supprimer mon compte définitivement
               </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          {!isAdmin ? (
            <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24 border border-white/5">
              <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-10"><Wallet size={24} /> Mon Coffre</h2>
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 mb-6">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Disponible pour retrait</p>
                <p className="text-2xl font-black italic">{user?.wallet?.balance || 0} Li</p>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${Math.min((user?.wallet?.balance / 25000) * 100, 100)}%` }} />
                </div>
                <p className="text-[8px] font-bold text-slate-500 mt-2">MINIMUM : 25 000 Li</p>
              </div>
              <button 
                onClick={handleWithdrawRequest} 
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isWithdrawDisabled ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-teal-500 text-slate-950 hover:bg-white'}`}
              >
                Demander un retrait
              </button>
            </div>
          ) : (
            <div className="bg-teal-600 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24">
              <h2 className="text-xl font-black flex items-center gap-3 text-white italic mb-4"><ShieldCheck size={24} /> Admin Access</h2>
              <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-wider">
                Compte d'administration actif. Les statistiques financières sont gérées via le panneau de contrôle global.
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
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-500/20 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900 shadow-inner" />
    </div>
  );
}
