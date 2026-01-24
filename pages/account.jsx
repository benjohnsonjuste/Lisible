"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Save, Edit3, ArrowLeft, 
  Settings, ShieldCheck, Sparkles, Loader2, ChevronRight 
} from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);

  // État local pour le formulaire
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    penName: "",
    birthday: "",
    profilePic: ""
  });

  const [payment, setPayment] = useState({
    method: "PayPal",
    paypalEmail: "",
    wuFirstName: "",
    wuLastName: "",
    country: "",
    areaCode: "",
    phone: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      
      // Remplissage profil
      setFormData({
        firstName: parsed.firstName || "",
        lastName: parsed.lastName || "",
        penName: parsed.penName || parsed.name || "",
        birthday: parsed.birthday || "",
        profilePic: parsed.profilePic || ""
      });

      // Remplissage paiement
      setPayment({
        method: parsed.paymentMethod || "PayPal",
        paypalEmail: parsed.paypalEmail || "",
        wuFirstName: parsed.wuMoneyGram?.firstName || "",
        wuLastName: parsed.wuMoneyGram?.lastName || "",
        country: parsed.wuMoneyGram?.country || "",
        areaCode: parsed.wuMoneyGram?.areaCode || "",
        phone: parsed.wuMoneyGram?.phone || "",
      });
      
      if (!parsed.paymentMethod) setEditingPayment(true);
    }
    setLoading(false);
  }, []);

  // Gestion de l'image (Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image trop lourde (max 2Mo)");

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, profilePic: ev.target.result }));
      setIsUploading(false);
      toast.info("Aperçu mis à jour. Pensez à enregistrer.");
    };
    reader.readAsDataURL(file);
  };

  // Sauvegarde centralisée (Profil + Paiement pour le Staff)
  const saveAllToStaffRegistry = async (customPayload = {}) => {
    const loadingToast = toast.loading("Synchronisation avec le registre Lisible...");
    
    // On fusionne tout pour que le fichier staff soit complet
    const finalPayload = {
      email: user.email,
      ...formData,
      paymentInfo: {
        ...payment,
        lastUpdate: new Date().toISOString()
      },
      ...customPayload,
      lastSync: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      if (!res.ok) throw new Error();

      // Mise à jour locale
      const updatedUser = { ...user, ...finalPayload };
      localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success("Informations sécurisées et transmises au staff.", { id: loadingToast });
      return true;
    } catch (err) {
      toast.error("Erreur de synchronisation serveur.", { id: loadingToast });
      return false;
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <Loader2 className="animate-spin h-10 w-10 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest">Accès au coffre-fort...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Paramètres</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Identité & Revenus</p>
        </div>
        <Link href="/dashboard" className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100 transition-all">
          <ArrowLeft size={24} />
        </Link>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLONNE PROFIL */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-50 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-3 text-slate-900 italic tracking-tight">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><User size={22} /></div>
              Profil de l'Auteur
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-32 h-32 rounded-[2.2rem] bg-white overflow-hidden border-4 border-white shadow-2xl relative transition-transform group-hover:scale-105 duration-500">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="animate-spin text-teal-600" /></div>
                  ) : (
                    <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Avatar" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:bg-slate-900 transition-all z-20">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="text-center sm:text-left relative z-10">
                <p className="text-2xl font-black text-slate-900 tracking-tight italic">{formData.penName || user?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <Sparkles size={12} className="text-teal-500" fill="currentColor" />
                    <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.2em]">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} placeholder="Pseudonyme public" />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button onClick={() => saveAllToStaffRegistry()} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
              <Save size={18} /> ENREGISTRER LE PROFIL
            </button>
          </div>
        </section>

        {/* COLONNE PAIEMENT (PRIVÉ STAFF) */}
        <section className="space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8 relative z-10">
              <CreditCard size={24} /> Versements
            </h2>

            <div className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-[0.2em]">Méthode</label>
                <select 
                  disabled={!editingPayment}
                  value={payment.method} 
                  onChange={e => setPayment({...payment, method: e.target.value})}
                  className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white appearance-none outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Western Union">Western Union</option>
                  <option value="MoneyGram">MoneyGram</option>
                </select>
              </div>

              {payment.method === "PayPal" ? (
                <div className="space-y-3 animate-in fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-[0.2em]">Compte PayPal</label>
                  <input 
                    type="email" disabled={!editingPayment} value={payment.paypalEmail}
                    onChange={e => setPayment({...payment, paypalEmail: e.target.value})}
                    className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-teal-400 outline-none"
                    placeholder="email@paypal.com"
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <input type="text" disabled={!editingPayment} placeholder="Prénom bénéficiaire" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white" />
                  <input type="text" disabled={!editingPayment} placeholder="Nom bénéficiaire" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" disabled={!editingPayment} placeholder="Pays" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white" />
                    <input type="text" disabled={!editingPayment} placeholder="Code" value={payment.areaCode} onChange={e => setPayment({...payment, areaCode: e.target.value})} className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white" />
                  </div>
                  <input type="text" disabled={!editingPayment} placeholder="Téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-slate-800 border-none rounded-[1.2rem] p-5 text-sm font-bold text-white" />
                </div>
              )}
            </div>

            <div className="mt-10 relative z-10">
                {editingPayment ? (
                  <button 
                    onClick={async () => {
                      const success = await saveAllToStaffRegistry();
                      if (success) setEditingPayment(false);
                    }} 
                    className="w-full py-5 bg-teal-500 text-white rounded-[1.5rem] font-black text-[10px] tracking-[0.2em] uppercase hover:bg-teal-400 transition-all shadow-xl shadow-teal-900/40"
                  >
                      CONFIRMER LES COORDONNÉES
                  </button>
                ) : (
                  <button onClick={() => setEditingPayment(true)} className="w-full py-5 bg-slate-800 text-teal-400 rounded-[1.5rem] font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 border border-slate-700">
                      <Edit3 size={16} /> MODIFIER LE PAIEMENT
                  </button>
                )}
            </div>

            <div className="mt-8 p-5 bg-white/5 rounded-[1.5rem] border border-white/10 flex gap-4 items-start relative z-10">
                <ShieldCheck size={28} className="text-teal-400 shrink-0" />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Données chiffrées destinées uniquement au service de comptabilité Lisible.
                </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Composant utilitaire pour les inputs
function InputBlock({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-100 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all placeholder:text-slate-300" 
      />
    </div>
  );
}
