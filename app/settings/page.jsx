"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, BookOpen, Star, Sparkles, AlertTriangle, Wallet, Camera
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
  const [formData, setFormData] = useState({ penName: "", birthday: "", profilePic: "" });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com", 
    "cmo.lablitteraire7@gmail.com", 
    "robergeaurodley97@gmail.com", 
    "jb7management@gmail.com", 
    "woolsleypierre01@gmail.com", 
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const getRank = (sc) => {
    if (sc >= 10000) return { name: "Maître de Plume", color: "text-purple-600", bg: "bg-purple-50", icon: "👑" };
    if (sc >= 2500) return { name: "Plume d'Argent", color: "text-slate-500", bg: "bg-slate-50", icon: "✨" };
    if (sc >= 1000) return { name: "Plume de Bronze", color: "text-orange-600", bg: "bg-orange-50", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-400", bg: "bg-slate-100", icon: "🖋️" };
  };

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
      if (res.ok) {
        const data = await res.json();
        const freshUser = data.content;
        setUser(freshUser);
        setFormData({ 
            penName: freshUser.penName || "",
            birthday: freshUser.birthday || "",
            profilePic: freshUser.profilePic || freshUser.image || ""
        });
        localStorage.setItem("lisible_user", JSON.stringify(freshUser));
      }
    } catch (e) { 
      console.error("Sync Error:", e);
      const local = JSON.parse(localStorage.getItem("lisible_user"));
      setUser(local);
    } finally { 
      setLoading(false); 
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const t = toast.loading("Mise à jour du manuscrit d'identité...");
    try {
      const res = await fetch('/api/github-db', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          action: 'update-user', 
          email: user.email, 
          updates: formData 
        }) 
      });
      
      if (res.ok) {
        const updated = { ...user, ...formData };
        localStorage.setItem("lisible_user", JSON.stringify(updated));
        setUser(updated);
        toast.success("Profil scellé avec succès", { id: t });
      } else {
        throw new Error();
      }
    } catch (e) { 
      toast.error("Échec de la synchronisation", { id: t }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (loading || !user) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9]">
      <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Authentification...</p>
    </div>
  );

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase().trim());
  const balance = user.li || 0;
  const rank = getRank(balance);
  const progressToWithdraw = Math.min((balance / 25000) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 pb-32 bg-[#FCFBF9]">
      {/* Header Profile */}
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
              <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer hover:bg-slate-900 shadow-lg transition-all active:scale-90">
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
           <div>
            <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-4 py-1.5 rounded-full mb-3 text-[9px] font-black uppercase tracking-widest border border-current/10`}>
              {rank.icon} {rank.name}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 italic tracking-tighter leading-none mb-2">
              {formData.penName || user.name || "Ma Plume"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-5 bg-slate-50 rounded-3xl text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
          <ArrowLeft size={24} />
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <AccountStatCard label="Inspirations" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-teal-600" />
        <AccountStatCard label="Abonnés" value={user?.followers?.length || 0} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Certification" value={user?.totalCertified || 0} icon={<ShieldCheck />} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl shadow-slate-200/60 border border-slate-100">
            <h2 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">
              <Edit3 size={18} /> Paramètres de l'auteur
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
              Sceller les changements
            </button>
          </div>
        </section>

        <aside className="space-y-8">
          <div className="bg-slate-950 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-12">
              <Wallet size={24} /> Coffre-fort
            </h2>
            
            <div className="space-y-8 relative z-10">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Solde actuel</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black italic tracking-tighter text-white">{balance.toLocaleString()}</span>
                  <span className="text-sm font-bold text-teal-400 uppercase">Li</span>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Retrait</span>
                    <span className="text-teal-400">{Math.floor(progressToWithdraw)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000 ease-out" 
                      style={{ width: `${progressToWithdraw}%` }} 
                    />
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 italic text-center pt-2">Seuil : 25,000 Li</p>
                </div>
              </div>

              <button 
                onClick={() => balance >= 25000 ? router.push("/withdraw") : toast.info("Solde insuffisant pour un retrait")}
                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  balance < 25000 
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                  : 'bg-teal-500 text-slate-950 hover:scale-105 shadow-lg shadow-teal-500/20'
                }`}
              >
                Demander un transfert
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-amber-500 rounded-[2.5rem] p-8 text-slate-950 shadow-xl border border-amber-400/50">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={24} />
                <h3 className="font-black uppercase text-xs tracking-widest italic">Accès Admin</h3>
              </div>
              <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-tighter">
                Accès prioritaire au registre des manuscrits de l'Atelier.
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
