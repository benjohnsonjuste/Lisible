"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, BookOpen, Star, Sparkles, AlertTriangle, Wallet, Camera
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
  const [formData, setFormData] = useState({ firstName: "", lastName: "", penName: "", birthday: "", profilePic: "" });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com", 
    "cmo.lablitteraire7@gmail.com", 
    "robergeaurodley97@gmail.com", 
    "jb7management@gmail.com", 
    "woolsleypierre01@gmail.com", 
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const getRank = (sc) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-600", bg: "bg-purple-50", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-500", bg: "bg-slate-50", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-600", bg: "bg-orange-50", icon: "📜" };
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
      // En App Router, on privilégie l'appel à ton API locale plutôt que GitHub direct pour le cache
      const res = await fetch(`/api/user-stats?email=${encodeURIComponent(email)}&t=${Date.now()}`);
      if (res.ok) {
        const freshUser = await res.json();
        setUser(freshUser);
        setFormData({ 
            ...freshUser, 
            penName: freshUser.penName || freshUser.name || "",
            firstName: freshUser.firstName || "",
            lastName: freshUser.lastName || "",
            birthday: freshUser.birthday || "",
            profilePic: freshUser.profilePic || ""
        });
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const t = toast.loading("Mise à jour du profil...");
    try {
      const updatedUser = { ...user, ...formData };
      const res = await fetch('/api/update-user', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: user.email, userData: formData }) 
      });
      
      if (res.ok) {
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Profil sauvegardé avec succès", { id: t });
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (e) { 
      toast.error("Échec de la sauvegarde", { id: t }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleWithdrawRequest = () => {
    const balance = user?.wallet?.balance || 0;
    if (balance < 25000) {
      toast.error(`Retrait impossible : Votre coffre contient ${balance} Li. Un minimum de 25 000 Li est requis.`, {
        icon: <AlertTriangle className="text-rose-500" size={20} />,
        duration: 5000
      });
      return;
    }
    router.push("/withdraw");
  };

  if (loading || !user) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#FCFBF9] gap-4 font-sans">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accès au coffre...</p>
    </div>
  );

  const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase().trim());
  const rank = getRank(user?.wallet?.balance || 0);
  const isWithdrawDisabled = (user?.wallet?.balance || 0) < 25000;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 animate-in fade-in duration-700 font-sans">
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20"><User size={30} /></div>
           <div>
            <div className={`inline-flex items-center gap-2 ${rank.bg} ${rank.color} px-3 py-1 rounded-xl mb-1 text-[8px] font-black uppercase tracking-widest border border-current/10`}>
              {rank.icon} {rank.name}
            </div>
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">Mon Compte</h1>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /></button>
      </header>

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 group transition-all hover:scale-105">
             <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Revenus Li</p>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black italic">{user?.wallet?.balance || 0}</span>
               <span className="text-xs font-bold text-teal-400">Li</span>
             </div>
          </div>
          <AccountStatCard label="Certifications" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
          <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
          <AccountStatCard label="Textes" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 space-y-10">
            <h2 className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Edit3 size={16} /> Identité de Plume</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                  <img 
                    src={formData.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${user.penName || 'P'}&backgroundColor=0f172a`} 
                    className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl transition-all group-hover:scale-105" 
                    alt="Profile"
                  />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-teal-600 shadow-lg transition-all active:scale-90">
                    <Camera size={18} />
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => { 
                            const file = e.target.files[0]; 
                            if (file) { 
                                const reader = new FileReader(); 
                                reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result }); 
                                reader.readAsDataURL(file); 
                            } 
                        }} 
                    />
                  </label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter mb-1">{formData.penName || "Plume de Lisible"}</p>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{user.email}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button 
              disabled={isSaving} 
              onClick={saveProfile} 
              className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Sauvegarder les modifications
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          {!isAdmin ? (
            <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24 border border-white/5">
              <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-10"><Wallet size={24} /> Coffre-fort</h2>
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 mb-6">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Capacité de retrait</p>
                <p className="text-2xl font-black italic">{user?.wallet?.balance || 0} Li</p>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                    <div 
                        className="h-full bg-teal-500 transition-all duration-1000" 
                        style={{ width: `${Math.min(((user?.wallet?.balance || 0) / 25000) * 100, 100)}%` }} 
                    />
                </div>
                <p className="text-[8px] font-black text-slate-500 mt-2">MINIMUM REQUIS : 25 000 Li</p>
              </div>
              <button 
                onClick={handleWithdrawRequest} 
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    isWithdrawDisabled 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60' 
                    : 'bg-teal-500 text-slate-950 hover:bg-white'
                }`}
              >
                Gérer mes retraits
              </button>
            </div>
          ) : (
            <div className="bg-teal-600 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24 border border-white/5">
              <h2 className="text-xl font-black flex items-center gap-3 text-white italic mb-4"><ShieldCheck size={24} /> Mode Admin</h2>
              <p className="text-[10px] font-bold opacity-80 leading-relaxed uppercase tracking-wider">
                Vous êtes connecté avec un compte d'administration Lisible. Les outils de gestion globale sont actifs.
              </p>
            </div>
          )}
        </aside>
      </div>

      <footer className="pt-10 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
           Sécurité Cryptographique • Lisible 2026
         </p>
      </footer>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900 shadow-inner" 
      />
    </div>
  );
}
