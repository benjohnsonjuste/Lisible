"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { User, CreditCard, Camera, Edit3, ArrowLeft, Loader2, Save, Download, Eye, Wallet } from "lucide-react";

const InputBlock = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900 shadow-inner" />
  </div>
);

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", penName: "", birthday: "", profilePic: "", paymentMethod: "PayPal", paypalEmail: "", wuFirstName: "", wuLastName: "", wuCountry: "" });

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (!stored) return router.push("/login");
    const fetchUser = async () => {
      try {
        const email = JSON.parse(stored).email;
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(email.toLowerCase().trim()).replace(/=/g, "")}.json`);
        if (res.ok) {
          const data = JSON.parse(atob((await res.json()).content));
          setUser(data);
          setFormData({ ...formData, ...data, wuFirstName: data.wuMoneyGram?.firstName, wuLastName: data.wuMoneyGram?.lastName, wuCountry: data.wuMoneyGram?.country });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  const download = async (id, name) => {
    const t = toast.loading("Génération HD...");
    try {
      const canvas = await html2canvas(document.getElementById(id), { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${name}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Téléchargé", { id: t });
    } catch { toast.error("Erreur", { id: t }); }
  };

  const save = async () => {
    setIsSaving(true);
    const res = await fetch('/api/update-user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, userData: { ...user, ...formData, wuMoneyGram: { firstName: formData.wuFirstName, lastName: formData.wuLastName, country: formData.wuCountry } } }) });
    if (res.ok) toast.success("Profil mis à jour");
    setIsSaving(false);
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20"><User size={30} /></div>
          <div><h1 className="text-3xl font-black italic tracking-tighter">Mon Compte</h1><p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">Identité & Portefeuille</p></div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"><ArrowLeft size={20} /></button>
      </header>

      {/* SECTION PRÉVISUALISATION DU BADGE */}
      <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-8">
        <div className="flex justify-between items-center border-b pb-6">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={16} /> Aperçu du Badge</h2>
          <button onClick={() => download("badge-officiel", "Badge_Lisible")} className="px-6 py-3 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg"><Download size={14} /> PNG HD</button>
        </div>
        <div className="flex justify-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <div id="badge-officiel" className="w-[400px] h-[400px] bg-white flex flex-col items-center justify-center p-8 text-center border-[12px] border-slate-900 shadow-2xl">
            <img src="/icon-192.png" className="w-16 h-16 mb-6" />
            <p className="text-teal-600 font-black uppercase text-[10px] tracking-[0.3em] mb-3">COMPTE OFFICIEL</p>
            <h2 className="text-3xl font-black text-slate-900 uppercase">{formData.firstName} {formData.lastName}</h2>
            <p className="text-sm text-slate-500 font-bold lowercase mb-8">{user.email}</p>
            <p className="text-[10px] font-black tracking-widest uppercase border-t w-full pt-4 text-slate-300">lisible.biz</p>
          </div>
        </div>
      </section>

      {/* FORMULAIRE DE PROFIL */}
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Edit3 size={16} /> Registre & Paiement</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] mb-10 border border-slate-100">
           <div className="relative">
              <img src={formData.profilePic || `https://api.dicebear.com/7.x/micah/svg?seed=${user.email}`} className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white shadow-xl" alt="Profil" />
              <label className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-teal-600 transition-colors"><Camera size={16} /><input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
                    reader.readAsDataURL(file);
                  }
              }} /></label>
           </div>
           <div className="text-center sm:text-left">
              <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{formData.penName || "Utilisateur"}</p>
              <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Membre Lisible</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
          <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
          <div className="md:col-span-2 flex gap-4">
            <button onClick={() => setFormData({...formData, paymentMethod: "PayPal"})} className={`flex-1 p-6 rounded-2xl border-2 font-black text-[10px] transition-all ${formData.paymentMethod === "PayPal" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-40"}`}>PAYPAL</button>
            <button onClick={() => setFormData({...formData, paymentMethod: "WU"})} className={`flex-1 p-6 rounded-2xl border-2 font-black text-[10px] transition-all ${formData.paymentMethod === "WU" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-40"}`}>W. UNION</button>
          </div>
          {formData.paymentMethod === "PayPal" ? <div className="md:col-span-2"><InputBlock label="Email PayPal" value={formData.paypalEmail} onChange={v => setFormData({...formData, paypalEmail: v})} /></div> : 
          <><InputBlock label="Prénom Bénéficiaire" value={formData.wuFirstName} onChange={v => setFormData({...formData, wuFirstName: v})} /><InputBlock label="Pays" value={formData.wuCountry} onChange={v => setFormData({...formData, wuCountry: v})} /></>}
        </div>
        <button disabled={isSaving} onClick={save} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase text-xs flex justify-center items-center gap-3 shadow-xl transition-all hover:bg-teal-600">
          {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Sauvegarder les modifications</>}
        </button>
      </div>
    </div>
  );
}
