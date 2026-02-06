"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { 
  User, ArrowLeft, Camera, Edit3, ShieldCheck, 
  Loader2, Save, BookOpen, Star, Sparkles, Lock, Trash2, Wallet 
} from "lucide-react";

function AccountStatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>{React.cloneElement(icon, { className: color, size: 20 })}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
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
  const [passData, setPassData] = useState({ current: "", new: "" });

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setFormData({ 
        firstName: parsed.firstName || "", 
        lastName: parsed.lastName || "", 
        penName: parsed.penName || parsed.name || "", 
        birthday: parsed.birthday || "", 
        profilePic: parsed.profilePic || "" 
      });
      setLoading(false);
    } else { 
      router.push("/login"); 
    }
  }, [router]);

  const saveProfile = async () => {
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
        toast.success("Profil sauvegardé", { id: t });
      }
    } catch (e) { toast.error("Erreur serveur", { id: t }); } finally { setIsSaving(false); }
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center bg-[#FCFBF9]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20 font-sans bg-[#FCFBF9]">
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 rounded-2xl bg-teal-600 text-white shadow-xl"><User size={30} /></div>
           <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compte Certifié</p>
            <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">Paramètres</h1>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /></button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
             <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Solde Actuel</p>
             <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black italic">{user?.wallet?.balance || 0}</span>
               <span className="text-xs font-bold text-teal-400">Li</span>
             </div>
          </div>
          <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
          <AccountStatCard label="Textes" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
          <AccountStatCard label="Certifications" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-50 space-y-10">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Edit3 size={16} /> Profil Public</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative group">
                  <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-teal-50">
                    <Image 
                      src={formData.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="Avatar" fill className="object-cover" unoptimized 
                    />
                  </div>
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

            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3 shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Enregistrer le profil
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24 border border-white/5">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-10"><Wallet size={24} /> Coffre Li</h2>
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 mb-6">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Seuil de retrait : 25 000 Li</p>
              <p className="text-2xl font-black italic">{user?.wallet?.balance || 0} Li</p>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: `${Math.min(((user?.wallet?.balance || 0) / 25000) * 100, 100)}%` }} />
              </div>
            </div>
            <button disabled className="w-full py-4 rounded-xl font-black text-[10px] uppercase bg-slate-800 text-slate-500 cursor-not-allowed">
              Retrait Indisponible
            </button>
          </div>
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
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-500/20 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all shadow-inner" 
      />
    </div>
  );
}
