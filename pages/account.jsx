"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, CreditCard, Camera, Save, Edit3, ArrowLeft, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  const [payment, setPayment] = useState({
    method: "PayPal", paypalEmail: "",
    wuFirstName: "", wuLastName: "", country: "", areaCode: "", phone: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData({
        firstName: parsed.firstName || "",
        lastName: parsed.lastName || "",
        penName: parsed.penName || parsed.name || "",
        birthday: parsed.birthday || "",
        profilePic: parsed.profilePic || ""
      });
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

  // SYSTÈME DE COMPRESSION D'IMAGE INTÉGRÉ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limite de sécurité avant compression (5Mo pour accepter les photos de téléphones récents)
    if (file.size > 5 * 1024 * 1024) return toast.error("Fichier trop lourd (max 5Mo)");

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; // Largeur optimale pour une photo de profil
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Exportation en JPEG compressé (0.7 = 70% de qualité, parfait pour le web)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        setFormData(prev => ({ ...prev, profilePic: compressedBase64 }));
        setIsUploading(false);
        toast.success("Photo traitée avec succès");
      };
    };
    reader.readAsDataURL(file);
  };

  const saveAllToStaffRegistry = async () => {
    if (!formData.firstName || !formData.lastName) return toast.error("Prénom et Nom requis");
    
    const loadingToast = toast.loading("Enregistrement sécurisé...");
    
    const payload = {
      email: user.email,
      name: user.name,
      firstName: formData.firstName,
      lastName: formData.lastName,
      penName: formData.penName,
      birthday: formData.birthday,
      profilePic: formData.profilePic,
      paymentMethod: payment.method,
      paypalEmail: payment.paypalEmail,
      wuMoneyGram: {
        firstName: payment.wuFirstName,
        lastName: payment.wuLastName,
        country: payment.country,
        areaCode: payment.areaCode,
        phone: payment.phone,
      }
    };

    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Gestion des erreurs de taille de body (Vercel renvoie du texte et non du JSON si ça dépasse)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Le serveur a refusé les données (image probablement trop lourde)");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      localStorage.setItem("lisible_user", JSON.stringify({ ...user, ...payload }));
      setUser({ ...user, ...payload });
      setEditingPayment(false);
      toast.success("Profil et paiement enregistrés !", { id: loadingToast });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  if (loading) return <div className="flex justify-center py-40 text-teal-600"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Auteur Lisible</p>
        </div>
        <Link href="/dashboard" className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SECTION PROFIL */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-3 italic text-slate-800">
              <User className="text-teal-600" /> Profil Public
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] relative overflow-hidden group border border-slate-100">
              <div className="relative z-10">
                <div className="w-32 h-32 rounded-[2.2rem] bg-white overflow-hidden border-4 border-white shadow-2xl relative">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <Loader2 className="animate-spin text-teal-600" />
                    </div>
                  ) : (
                    <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Profil" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:bg-slate-900 transition-colors">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="text-center sm:text-left z-10">
                <p className="text-2xl font-black text-slate-900 italic tracking-tight">{formData.penName || user?.name}</p>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <Sparkles size={12} className="text-teal-500" />
                  <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button 
              onClick={saveAllToStaffRegistry} 
              className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-slate-200"
            >
              <Save size={18} /> ENREGISTRER LE PROFIL
            </button>
          </div>
        </section>

        {/* SECTION PAIEMENT */}
        <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8 relative z-10">
            <CreditCard size={24} /> Versements
          </h2>
          
          <div className="space-y-6 relative z-10">
            <select 
              disabled={!editingPayment} 
              value={payment.method} 
              onChange={e => setPayment({...payment, method: e.target.value})} 
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white outline-none ring-teal-500/50 focus:ring-2 transition-all"
            >
              <option value="PayPal">PayPal</option>
              <option value="Western Union">Western Union</option>
              <option value="MoneyGram">MoneyGram</option>
            </select>

            {payment.method === "PayPal" ? (
              <input 
                type="email" 
                disabled={!editingPayment} 
                value={payment.paypalEmail} 
                onChange={e => setPayment({...payment, paypalEmail: e.target.value})} 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-teal-400 outline-none placeholder:text-slate-600" 
                placeholder="Email PayPal" 
              />
            ) : (
              <div className="space-y-4">
                <input type="text" disabled={!editingPayment} placeholder="Prénom du bénéficiaire" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold placeholder:text-slate-600" />
                <input type="text" disabled={!editingPayment} placeholder="Nom du bénéficiaire" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold placeholder:text-slate-600" />
                <input type="text" disabled={!editingPayment} placeholder="Pays de résidence" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold placeholder:text-slate-600" />
                <input type="text" disabled={!editingPayment} placeholder="Numéro de téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold placeholder:text-slate-600" />
              </div>
            )}
          </div>

          <div className="mt-10 relative z-10">
            {editingPayment ? (
              <button 
                onClick={saveAllToStaffRegistry} 
                className="w-full py-5 bg-teal-500 text-slate-950 rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
              >
                CONFIRMER LES INFOS
              </button>
            ) : (
              <button 
                onClick={() => setEditingPayment(true)} 
                className="w-full py-5 bg-slate-800 text-teal-400 rounded-[1.5rem] font-black text-[10px] uppercase border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
              >
                <Edit3 size={16} /> MODIFIER LE PAIEMENT
              </button>
            )}
          </div>
        </section>
      </div>
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
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-100 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all text-slate-700" 
      />
    </div>
  );
}
