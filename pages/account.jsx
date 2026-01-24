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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) return toast.error("Image trop lourde (max 1.5Mo)");

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, profilePic: ev.target.result }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const saveAllToStaffRegistry = async () => {
    if (!formData.firstName || !formData.lastName) return toast.error("Prénom et Nom requis");
    
    const loadingToast = toast.loading("Enregistrement sécurisé...");
    
    // Structure EXACTE pour l'API
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
          <h1 className="text-4xl font-black text-slate-900 italic">Mon Compte</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Auteur Lisible</p>
        </div>
        <Link href="/dashboard" className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100"><ArrowLeft size={24} /></Link>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PROFIL */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-3 italic"><User className="text-teal-600" /> Profil Public</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-32 h-32 rounded-[2.2rem] bg-white overflow-hidden border-4 border-white shadow-2xl">
                  {isUploading ? <Loader2 className="animate-spin m-auto mt-12" /> : <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" />}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:bg-slate-900"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label>
              </div>
              <div className="text-center sm:text-left z-10">
                <p className="text-2xl font-black text-slate-900 italic">{formData.penName || user?.name}</p>
                <div className="flex items-center gap-2 mt-1"><Sparkles size={12} className="text-teal-500" /><p className="text-[10px] text-teal-600 font-black uppercase">{user?.email}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>
            <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 flex items-center justify-center gap-3"><Save size={18} /> ENREGISTRER LE PROFIL</button>
          </div>
        </section>

        {/* PAIEMENT */}
        <section className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8"><CreditCard size={24} /> Versements</h2>
          <div className="space-y-6 relative z-10">
            <select disabled={!editingPayment} value={payment.method} onChange={e => setPayment({...payment, method: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold text-white outline-none ring-teal-500 focus:ring-2">
              <option value="PayPal">PayPal</option>
              <option value="Western Union">Western Union</option>
              <option value="MoneyGram">MoneyGram</option>
            </select>

            {payment.method === "PayPal" ? (
              <input type="email" disabled={!editingPayment} value={payment.paypalEmail} onChange={e => setPayment({...payment, paypalEmail: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold text-teal-400 outline-none" placeholder="Email PayPal" />
            ) : (
              <div className="space-y-4">
                <input type="text" disabled={!editingPayment} placeholder="Prénom" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Nom" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Pays" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-slate-800 rounded-2xl p-5 text-sm font-bold" />
              </div>
            )}
          </div>
          <div className="mt-10">
            {editingPayment ? (
              <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-teal-500 text-white rounded-[1.5rem] font-black text-[10px] tracking-widest uppercase shadow-xl shadow-teal-900/40">CONFIRMER</button>
            ) : (
              <button onClick={() => setEditingPayment(true)} className="w-full py-5 bg-slate-800 text-teal-400 rounded-[1.5rem] font-black text-[10px] uppercase border border-slate-700 flex items-center justify-center gap-2"><Edit3 size={16} /> MODIFIER</button>
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
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-100 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all" />
    </div>
  );
}
