"use client";
import React, { useState, useEffect } from "react";
import { 
  Save, Plus, Trash2, Megaphone, Link as LinkIcon, 
  Palette, Loader2, ShieldAlert, History, ArrowLeft, 
  CheckCircle, Globe
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AdminPartners() {
  const router = useRouter();
  const [partners, setPartners] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ACCÈS RESTREINT
  const ADMIN_EMAILS = ["cmo.lablitteraire7@gmail.com"];
  const ADMIN_NAMES = ["Lisible Support Team"];

  useEffect(() => {
    const checkAuth = () => {
      const logged = localStorage.getItem("lisible_user");
      if (!logged) {
        toast.error("Veuillez vous connecter");
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
        loadConfig();
      }
    };

    if (router.isReady) checkAuth();
  }, [router.isReady]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/update-partners');
      const data = await res.json();
      setPartners(data.ads || []);
      setMetadata(data._metadata || null);
    } catch (e) {
      toast.error("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };

  const addPartner = () => {
    const newP = { 
      id: `ad_${Date.now()}`, 
      message: "Nouveau message partenaire", 
      link: "https://", 
      color: "bg-slate-900", 
      cta: "Découvrir" 
    };
    setPartners([newP, ...partners]);
    toast.success("Nouveau slot ajouté");
  };

  const updatePartner = (id, field, value) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePartner = (id) => {
    setPartners(partners.filter(p => p.id !== id));
    toast.info("Slot supprimé de la liste locale");
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
        toast.success("Configuration déployée sur Lisible !");
        loadConfig();
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Échec de la mise à jour GitHub");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authentification Lisible...</p>
    </div>
  );

  if (!isAuthorized) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <div className="bg-rose-50 p-8 rounded-[3rem] text-rose-500 shadow-xl shadow-rose-100/50">
        <ShieldAlert size={64} />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">Accès Refusé</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-sm">
          Seul le Support Team peut modifier les actifs marketing.
        </p>
      </div>
      <Link href="/" className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-teal-600 transition-all">
        Quitter la zone
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <Link href="/" className="group inline-flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-teal-600 transition-colors">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Retour site
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-4 rounded-3xl text-teal-400 shadow-2xl">
              <Globe size={32} />
            </div>
            <div>
              <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">Partner Ops</h1>
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.4em] mt-2">Gestion des bannières premium</p>
            </div>
          </div>
        </div>
        
        <button onClick={addPartner} className="w-full md:w-auto flex items-center justify-center gap-3 bg-white border border-slate-100 px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-200/50">
          <Plus size={16}/> Nouveau partenaire
        </button>
      </header>

      {/* MÉTADONNÉES / HISTORIQUE */}
      {metadata && (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
             <History size={120} className="text-white" />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20">
              <History size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Dernier déploiement</p>
              <p className="text-sm font-bold text-white italic tracking-tight">
                Le {new Date(metadata.lastUpdate).toLocaleString('fr-FR')} <span className="text-slate-500 mx-2">|</span> Par {metadata.updatedBy}
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
             <CheckCircle size={14} className="text-teal-500" />
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Contenu synchronisé</span>
          </div>
        </div>
      )}

      {/* LISTE DES PARTENAIRES */}
      <div className="grid grid-cols-1 gap-8">
        {partners.length === 0 && (
          <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem]">
            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Aucune campagne active</p>
          </div>
        )}

        {partners.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 p-8 md:p-12 rounded-[4rem] shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Message & Lien */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Phrase d'accroche</label>
                  <div className="relative">
                    <Megaphone className="absolute left-6 top-6 text-slate-300" size={18} />
                    <input 
                      value={p.message} 
                      onChange={(e) => updatePartner(p.id, 'message', e.target.value)} 
                      className="w-full bg-slate-50 border-none rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold focus:bg-white focus:ring-4 ring-teal-50 transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Lien (URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-6 top-6 text-slate-300" size={18} />
                    <input 
                      value={p.link} 
                      onChange={(e) => updatePartner(p.id, 'link', e.target.value)} 
                      className="w-full bg-slate-50 border-none rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold focus:bg-white focus:ring-4 ring-teal-50 transition-all outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Styles & CTA */}
              <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Couleur Thème</label>
                    <select 
                      value={p.color} 
                      onChange={(e) => updatePartner(p.id, 'color', e.target.value)} 
                      className="w-full bg-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase border border-slate-100 outline-none cursor-pointer"
                    >
                      <option value="bg-slate-900">Noir Ardoise</option>
                      <option value="bg-teal-600">Vert Lisible</option>
                      <option value="bg-indigo-600">Bleu Royal</option>
                      <option value="bg-rose-600">Rouge Sceau</option>
                      <option value="bg-amber-500">Or Ambré</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Texte Bouton</label>
                    <input 
                      value={p.cta} 
                      onChange={(e) => updatePartner(p.id, 'cta', e.target.value)} 
                      className="w-full bg-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase border border-slate-100 text-center outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                  <button 
                    onClick={() => deletePartner(p.id)} 
                    className="flex items-center gap-2 px-6 py-3 text-rose-500 font-black text-[9px] uppercase hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={14} /> Retirer le slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-32" />

      {/* BOUTON FLOTTANT DE SAUVEGARDE */}
      <div className="fixed bottom-12 left-0 right-0 flex justify-center z-[60] pointer-events-none">
        <button 
          onClick={saveConfig} 
          disabled={saving || partners.length === 0} 
          className="pointer-events-auto bg-slate-900 text-white px-16 py-8 rounded-full font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
          Pousser les modifications
        </button>
      </div>

      <footer className="text-center py-10 opacity-20">
        <p className="text-[9px] font-black uppercase tracking-[0.5em]">Lisible Engineering • Admin Console</p>
      </footer>
    </div>
  );
}
