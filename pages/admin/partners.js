"use client";
import React, { useState, useEffect } from "react";
import { 
  Save, Plus, Trash2, Megaphone, Link as LinkIcon, 
  Palette, Loader2, ShieldAlert, History, ArrowLeft, 
  CheckCircle, Globe, Eye, MousePointer2, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AdminPartners() {
  const router = useRouter();
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({}); // Stockage des clics/vues
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const ADMIN_EMAILS = ["cmo.lablitteraire7@gmail.com"];
  const ADMIN_NAMES = ["Lisible Support Team"];

  useEffect(() => {
    const checkAuth = () => {
      const logged = localStorage.getItem("lisible_user");
      if (!logged) {
        router.push("/");
        return;
      }
      const user = JSON.parse(logged);
      const hasAccess = ADMIN_EMAILS.includes(user.email) || ADMIN_NAMES.includes(user.penName || user.name);

      if (!hasAccess) {
        setIsAuthorized(false);
        setLoading(false);
      } else {
        setIsAuthorized(true);
        loadData();
      }
    };
    if (router.isReady) checkAuth();
  }, [router.isReady]);

  const loadData = async () => {
    try {
      // 1. Charger la config des pubs
      const resConfig = await fetch('/api/admin/update-partners');
      const dataConfig = await resConfig.json();
      setPartners(dataConfig.ads || []);
      setMetadata(dataConfig._metadata || null);

      // 2. Charger les statistiques (Vues/Clics)
      // Note: On utilise l'API tracker avec un paramètre GET (à adapter dans votre API si besoin)
      // Ou on peut lire directement le fichier de stats via une nouvelle route
      const resStats = await fetch('/api/partner-tracker-stats'); // Route à créer ou simuler
      if (resStats.ok) {
        const dataStats = await resStats.json();
        setStats(dataStats);
      }
    } catch (e) {
      console.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    const logged = JSON.parse(localStorage.getItem("lisible_user"));
    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ads: partners, 
          adminUser: logged.penName || logged.name 
        })
      });
      if (res.ok) {
        toast.success("Publicités déployées !");
        loadData();
      }
    } catch (e) { toast.error("Erreur GitHub"); } 
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <Link href="/" className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
            <ArrowLeft size={14}/> Retour site
          </Link>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">Partner Ops & Stats</h1>
        </div>
        <button onClick={() => setPartners([{ id: `ad_${Date.now()}`, message: "", link: "https://", color: "bg-slate-900", cta: "Découvrir" }, ...partners])} className="bg-white border border-slate-200 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
          <Plus size={16}/> Nouveau Partenaire
        </button>
      </header>

      {/* HISTORIQUE & STATS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white font-black italic">
        <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between border border-slate-800">
           <div>
              <p className="text-[9px] text-slate-500 uppercase not-italic tracking-widest mb-1">Dernier déploiement</p>
              <p className="text-sm uppercase tracking-tight">{metadata?.updatedBy} le {new Date(metadata?.lastUpdate).toLocaleDateString()}</p>
           </div>
           <History className="text-slate-800" size={40} />
        </div>
        <div className="bg-teal-600 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-teal-500/20">
           <div>
              <p className="text-[9px] text-teal-100 uppercase not-italic tracking-widest mb-1">Slots Actifs</p>
              <p className="text-4xl">{partners.length}</p>
           </div>
           <BarChart3 className="text-teal-400" size={40} />
        </div>
      </div>

      {/* LISTE DES CAMPAGNES */}
      <div className="space-y-8">
        {partners.map((p) => {
          const pStats = stats[p.id] || { views: 0, clicks: 0 };
          const ctr = pStats.views > 0 ? ((pStats.clicks / pStats.views) * 100).toFixed(1) : 0;

          return (
            <div key={p.id} className="bg-white border border-slate-100 p-8 rounded-[4rem] shadow-xl space-y-8">
              <div className="flex flex-wrap gap-4 border-b border-slate-50 pb-8">
                {/* Petit Dashboard de stats pour CE partenaire */}
                <div className="bg-slate-50 px-6 py-4 rounded-3xl flex items-center gap-4">
                  <div className="text-teal-500 bg-teal-50 p-2 rounded-xl"><Eye size={18}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Impressions</p>
                    <p className="text-lg font-black text-slate-900 leading-none">{pStats.views}</p>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-3xl flex items-center gap-4">
                  <div className="text-indigo-500 bg-indigo-50 p-2 rounded-xl"><MousePointer2 size={18}/></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clics</p>
                    <p className="text-lg font-black text-slate-900 leading-none">{pStats.clicks}</p>
                  </div>
                </div>
                <div className="bg-slate-900 px-6 py-4 rounded-3xl flex items-center gap-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Taux (CTR)</p>
                    <p className="text-lg font-black text-teal-400 leading-none">{ctr}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <input value={p.message} onChange={(e) => setPartners(partners.map(x => x.id === p.id ? {...x, message: e.target.value} : x))} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20" placeholder="Message publicitaire..." />
                  <input value={p.link} onChange={(e) => setPartners(partners.map(x => x.id === p.id ? {...x, link: e.target.value} : x))} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-teal-500/20" placeholder="Lien URL..." />
                </div>
                <div className="flex items-center gap-4">
                   <select value={p.color} onChange={(e) => setPartners(partners.map(x => x.id === p.id ? {...x, color: e.target.value} : x))} className="bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase flex-1">
                      <option value="bg-slate-900">Noir</option>
                      <option value="bg-teal-600">Vert</option>
                      <option value="bg-indigo-600">Bleu</option>
                      <option value="bg-rose-600">Rouge</option>
                   </select>
                   <button onClick={() => setPartners(partners.filter(x => x.id !== p.id))} className="p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                      <Trash2 size={20} />
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none">
        <button onClick={saveConfig} disabled={saving} className="pointer-events-auto bg-slate-900 text-white px-12 py-6 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl flex items-center gap-4 hover:scale-105 transition-all">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
          Pousser les modifications
        </button>
      </div>
    </div>
  );
}
