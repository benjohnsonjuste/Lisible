"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, CreditCard, Camera, Save, Edit3, ArrowLeft, Settings, ShieldCheck } from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Infos de profil
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    penName: "",
    birthday: "",
    profilePic: ""
  });

  // Paiement
  const [payment, setPayment] = useState({
    method: "PayPal",
    paypalEmail: "",
    wuFirstName: "",
    wuLastName: "",
    country: "",
    areaCode: "",
    phone: "",
  });
  const [editingPayment, setEditingPayment] = useState(false);

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
      setEditingPayment(!parsed.paymentMethod);
    }
    setLoading(false);
  }, []);

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName) return toast.error("Nom et Prénom requis");
    const loadingToast = toast.loading("Mise à jour du profil...");
    
    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, ...formData }),
      });
      if (!res.ok) throw new Error();
      
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profil mis à jour !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde", { id: loadingToast });
    }
  };

  const handleSavePayment = async () => {
    if (payment.method === "PayPal" && !payment.paypalEmail) return toast.error("Email PayPal requis");
    const loadingToast = toast.loading("Enregistrement du mode de paiement...");
    
    const payload = {
      email: user.email,
      paymentMethod: payment.method,
      paypalEmail: payment.method === "PayPal" ? payment.paypalEmail : "",
      wuMoneyGram: payment.method !== "PayPal" ? {
        firstName: payment.wuFirstName,
        lastName: payment.wuLastName,
        country: payment.country,
        areaCode: payment.areaCode,
        phone: payment.phone,
      } : {}
    };

    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      
      const updatedUser = { ...user, ...payload };
      localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditingPayment(false);
      toast.success("Mode de paiement enregistré !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur de sauvegarde", { id: loadingToast });
    }
  };

  if (loading) return <div className="flex justify-center p-20 animate-spin text-teal-600"><Settings size={40} /></div>;

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Paramètres</h1>
            <p className="text-gray-500 font-medium text-sm">Gérez vos informations et vos revenus</p>
        </div>
        <Link href="/dashboard" className="p-4 bg-white rounded-2xl text-gray-400 hover:text-teal-600 transition-all shadow-sm border border-gray-100">
          <ArrowLeft size={24} />
        </Link>
      </header>

      {/* Statistiques de monétisation */}
      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Colonne Profil */}
        <section className="lg:col-span-2 space-y-6">
          <div className="card-lisible space-y-8">
            <h2 className="text-xl font-black flex items-center gap-3 text-gray-800">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><User size={20} /></div>
              Profil de l'auteur
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[1.5rem] bg-teal-100 overflow-hidden border-4 border-white shadow-md">
                  <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Profil" />
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-teal-600 text-white rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-all">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setFormData({...formData, profilePic: ev.target.result});
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <p className="font-black text-xl text-gray-900">{user?.name}</p>
                <p className="text-sm text-teal-600 font-bold opacity-80 uppercase tracking-widest">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Prénom</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="input-lisible" placeholder="Prénom" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Nom</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="input-lisible" placeholder="Nom de famille" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Nom de plume</label>
                <input type="text" value={formData.penName} onChange={e => setFormData({...formData, penName: e.target.value})} className="input-lisible" placeholder="Pseudonyme public" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Date de naissance</label>
                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="input-lisible" />
              </div>
            </div>

            <button onClick={handleSaveProfile} className="btn-lisible w-full shadow-lg shadow-teal-50 gap-2">
              <Save size={20} /> ENREGISTRER MON PROFIL
            </button>
          </div>
        </section>

        {/* Colonne Paiement */}
        <section className="space-y-6">
          <div className="card-lisible space-y-6 bg-slate-900 text-white border-none shadow-xl">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400">
              <CreditCard size={22} /> Paiements
            </h2>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Méthode préférée</label>
                <select 
                  disabled={!editingPayment}
                  value={payment.method} 
                  onChange={e => setPayment({...payment, method: e.target.value})}
                  className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none text-white appearance-none"
                >
                  <option value="PayPal">PayPal</option>
                  <option value="Western Union">Western Union</option>
                  <option value="MoneyGram">MoneyGram</option>
                </select>
              </div>

              {payment.method === "PayPal" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-3 tracking-widest">Compte PayPal</label>
                  <input 
                    type="email" 
                    disabled={!editingPayment}
                    value={payment.paypalEmail} 
                    onChange={e => setPayment({...payment, paypalEmail: e.target.value})}
                    className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-teal-400 placeholder:text-slate-600"
                    placeholder="exemple@mail.com"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="text" disabled={!editingPayment} placeholder="Prénom du bénéficiaire" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white" />
                  <input type="text" disabled={!editingPayment} placeholder="Nom du bénéficiaire" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" disabled={!editingPayment} placeholder="Pays" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white" />
                    <input type="text" disabled={!editingPayment} placeholder="Code Zone" value={payment.areaCode} onChange={e => setPayment({...payment, areaCode: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white" />
                  </div>
                  <input type="text" disabled={!editingPayment} placeholder="Numéro de téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold text-white" />
                </div>
              )}
            </div>

            {editingPayment ? (
              <button onClick={handleSavePayment} className="w-full py-4 bg-teal-500 text-white rounded-2xl font-black hover:bg-teal-400 transition-all shadow-lg shadow-teal-900/20">
                CONFIRMER LES COORDONNÉES
              </button>
            ) : (
              <button onClick={() => setEditingPayment(true)} className="w-full py-4 bg-slate-800 text-teal-400 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-700 transition-all border border-slate-700">
                <Edit3 size={18} /> MODIFIER LE PAIEMENT
              </button>
            )}

            <div className="p-4 bg-teal-400/10 rounded-2xl border border-teal-400/20 flex gap-3">
                <ShieldCheck size={30} className="text-teal-400 shrink-0" />
                <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    Vos données de paiement sont stockées de manière sécurisée pour les versements mensuels.
                </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
