"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Changement pour compatibilité App Router
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, BookOpen, Eye, Heart, Plus,
  RefreshCcw, Sparkles, Layout, BarChart3, Save
} from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingLi, setIsRefreshingLi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [myTexts, setMyTexts] = useState([]);
  
  // États spécifiques Partenaire
  const [adsConfig, setAdsConfig] = useState({ ads: [] });
  const [partnerStats, setPartnerStats] = useState({});

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  const isSpecialPartner = user?.email?.toLowerCase() === "cmo.lablitteraire7@gmail.com";

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      refreshUserData(parsed.email);
    } else {
      router.push("/login");
    }
  }, []);

  const refreshUserData = async (email) => {
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
        
        if (freshUser.email) fetchAuthorTexts(freshUser.email);
        if (email.toLowerCase() === "cmo.lablitteraire7@gmail.com") loadPartnerData();
      }
    } catch (e) { console.error(e); }
    finally { setIsRefreshingLi(false); setLoading(false); }
  };

  const loadPartnerData = async () => {
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/admin-update-partner'),
        fetch('/api/partner-tracker-stats')
      ]);
      if (configRes.ok) setAdsConfig(await configRes.json());
      if (statsRes.ok) setPartnerStats(await statsRes.json());
    } catch (e) { console.error("Partner Load Error", e); }
  };

  const fetchAuthorTexts = async (email) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      if (!res.ok) return;
      const files = await res.json();
      const textPromises = files.filter(f => f.name.endsWith('.json')).map(file => fetch(file.download_url).then(r => r.json()));
      const allTexts = await Promise.all(textPromises);
      const filtered = allTexts.filter(t => t.authorEmail?.toLowerCase() === email.toLowerCase());
      setMyTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) { console.error(e); }
  };

  const saveAds = async () => {
    const t = toast.loading("Mise à jour des publicités...");
    try {
      await fetch('/api/admin-update-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads: adsConfig.ads, adminUser: user.email })
      });
      toast.success("Espace publicitaire mis à jour", { id: t });
    } catch (e) { toast.error("Erreur", { id: t }); }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-2" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Synchronisation du Registre...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <User size={32} />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Registre Officiel Lisible</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 bg-slate-50 p-2 pl-6 rounded-3xl border border-slate-100">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mon Trésor</span>
                <span className="text-2xl font-black text-slate-900">{(user?.wallet?.balance || 0)} <span className="text-xs text-teal-600">Li</span></span>
             </div>
             <button onClick={() => refreshUserData(user.email)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-teal-600 transition-all">
               <RefreshCcw size={20} className={isRefreshingLi ? "animate-spin" : ""} />
             </button>
          </div>
          <button onClick={() => router.back()} className="p-4 border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600">
            <ArrowLeft size={24} />
          </button>
        </div>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          {/* IDENTITÉ */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-[11px] font-black italic text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
               <Edit3 size={18} /> {isSpecialPartner ? "Gestion du Partenaire" : "Profil Public & Civil"}
            </h2>
            
            <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <img src={formData.profilePic || "/avatar.png"} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg" alt="" />
               <div>
                  <p className="text-2xl font-black text-slate-900 italic">{formData.penName || user?.name}</p>
                  <span className="text-[10px] font-black text-teal-600 uppercase flex items-center gap-1">
                    <ShieldCheck size={14} /> {isSpecialPartner ? "Partenaire Officiel" : "Auteur Certifié"}
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
              <InputBlock label="Nom de plume / Partenaire" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance / Création" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button onClick={() => refreshUserData(user.email)} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all">
              Sauvegarder les informations
            </button>
          </div>

          {/* GESTIONNAIRE DE PUB (RÉSERVÉ PARTENAIRE) */}
          {isSpecialPartner && (
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-[11px] font-black italic text-teal-400 uppercase tracking-[0.3em] flex items-center gap-2">
                   <Layout size={18} /> Gestionnaire de Pub
                </h2>
                <button onClick={saveAds} className="px-6 py-3 bg-teal-500 text-slate-950 rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
                  <Save size={16} /> Publier les changements
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adsConfig.ads.map((ad, idx) => (
                  <div key={idx} className="bg-slate-800 p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between text-teal-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Bannière #{ad.id}</span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-xs font-black"><Eye size={12}/> {partnerStats[ad.id]?.views || 0}</span>
                        <span className="flex items-center gap-1 text-xs font-black"><BarChart3 size={12}/> {partnerStats[ad.id]?.clicks || 0}</span>
                      </div>
                    </div>
                    <input 
                      className="w-full bg-slate-900 border-none rounded-lg p-3 text-xs" 
                      placeholder="URL de l'image"
                      value={ad.imageUrl}
                      onChange={(e) => {
                        const newAds = [...adsConfig.ads];
                        newAds[idx].imageUrl = e.target.value;
                        setAdsConfig({ ...adsConfig, ads: newAds });
                      }}
                    />
                    <input 
                      className="w-full bg-slate-900 border-none rounded-lg p-3 text-xs" 
                      placeholder="Lien de destination"
                      value={ad.link}
                      onChange={(e) => {
                        const newAds = [...adsConfig.ads];
                        newAds[idx].link = e.target.value;
                        setAdsConfig({ ...adsConfig, ads: newAds });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* COLONNE DROITE : VERSEMENTS OU STATS GLOBALES */}
        {!isSpecialPartner ? (
          <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl h-fit sticky top-10">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8">
              <CreditCard size={24} /> Versements
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-slate-900 rounded-2xl border border-white/5 space-y-2">
                 <p className="text-[8px] font-black text-slate-500 uppercase">Seuil : 5000 Li</p>
                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(((user?.wallet?.balance || 0) / 5000) * 100, 100)}%` }} />
                 </div>
              </div>
              <button className="w-full py-5 bg-slate-800 text-teal-400 rounded-xl font-black text-[10px] uppercase border border-slate-700">
                Modifier Méthode
              </button>
            </div>
          </section>
        ) : (
          <section className="bg-teal-600 rounded-[3rem] p-8 text-slate-950 shadow-2xl h-fit sticky top-10">
            <h2 className="text-xl font-black italic mb-6">Performance Marketing</h2>
            <div className="space-y-4">
              <div className="p-5 bg-white/20 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Vues Pub</p>
                <p className="text-3xl font-black tracking-tighter">
                  {Object.values(partnerStats).reduce((acc, curr) => acc + (curr.views || 0), 0)}
                </p>
              </div>
              <div className="p-5 bg-white/20 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Taux de Clic Moyen</p>
                <p className="text-3xl font-black tracking-tighter">
                  {(() => {
                    const v = Object.values(partnerStats).reduce((acc, curr) => acc + (curr.views || 0), 0);
                    const c = Object.values(partnerStats).reduce((acc, curr) => acc + (curr.clicks || 0), 0);
                    return v > 0 ? ((c / v) * 100).toFixed(1) : 0;
                  })()}%
                </p>
              </div>
            </div>
          </section>
        )}
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
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all" 
      />
    </div>
  );
}
