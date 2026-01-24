"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, CreditCard, Camera, Save, Edit3, ArrowLeft, Settings } from "lucide-react";
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
      toast.success("Profil mis à jour !");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSavePayment = async () => {
    if (payment.method === "PayPal" && !payment.paypalEmail) return toast.error("Email PayPal requis");
    
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
      toast.success("Infos de paiement enregistrées !");
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  if (loading) return <div className="flex justify-center p-20 animate-spin"><Settings /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-600 transition-all">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Paramètres du compte</h1>
      </header>

      {/* Statistiques Globales */}
      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Profil */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-black flex items-center gap-3">
              <User className="text-blue-600" /> Profil de l'auteur
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 rounded-[2rem]">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-indigo-100 overflow-hidden border-4 border-white shadow-lg">
                  <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Profil" />
                </div>
                <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
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
                <p className="font-black text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-400 font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Prénom</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nom</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Nom de plume (Public)</label>
                <input type="text" value={formData.penName} onChange={e => setFormData({...formData, penName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Date de naissance</label>
                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>
            </div>

            <button onClick={handleSaveProfile} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-gray-100">
              <Save size={18} /> ENREGISTRER LE PROFIL
            </button>
          </div>
        </section>

        {/* Colonne Paiement */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-black flex items-center gap-3">
              <CreditCard className="text-emerald-500" /> Revenus
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Méthode de retrait</label>
                <select 
                  disabled={!editingPayment}
                  value={payment.method} 
                  onChange={e => setPayment({...payment, method: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option>PayPal</option>
                  <option>Western Union</option>
                  <option>MoneyGram</option>
                </select>
              </div>

              {payment.method === "PayPal" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Email PayPal</label>
                  <input 
                    type="email" 
                    disabled={!editingPayment}
                    value={payment.paypalEmail} 
                    onChange={e => setPayment({...payment, paypalEmail: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <input type="text" disabled={!editingPayment} placeholder="Prénom" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold" />
                  <input type="text" disabled={!editingPayment} placeholder="Nom" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" disabled={!editingPayment} placeholder="Pays" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold" />
                    <input type="text" disabled={!editingPayment} placeholder="Code" value={payment.areaCode} onChange={e => setPayment({...payment, areaCode: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-3 text-sm font-bold" />
                  </div>
                  <input type="text" disabled={!editingPayment} placeholder="Téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold" />
                </div>
              )}
            </div>

            {editingPayment ? (
              <button onClick={handleSavePayment} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-50">
                CONFIRMER LES INFOS
              </button>
            ) : (
              <button onClick={() => setEditingPayment(true)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                <Edit3 size={18} /> MODIFIER LE PAIEMENT
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
